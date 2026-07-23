// server/routes/withdrawal.js
console.log('Withdrawal route loaded');

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const auth = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Config = require('../models/Config');
const { sendMail } = require('../utils/mailer'); // Use mailer.js utility
const { getCryptoUSDPrices } = require('../utils/cryptoRates');

const DEFAULT_ACTIVATION_FEE = 10;
const DEFAULT_INTEREST_TAX_PERCENT = 5;
const DEFAULT_NETWORK_FEES = {
  ETH: 5,
  BTC: 10,
  USDT: 2,
  BNB: 3
};

async function getConfigValue(key, fallback) {
  const doc = await Config.findOne({ key }).lean().exec();
  return doc && doc.value !== undefined ? doc.value : fallback;
}

async function getActivationFeeAmount() {
  return Number(await getConfigValue('withdrawal.activationFeeAmount', DEFAULT_ACTIVATION_FEE));
}

async function getInterestTaxPercent() {
  return Number(await getConfigValue('withdrawal.interestTaxPercent', DEFAULT_INTEREST_TAX_PERCENT));
}

async function getNetworkFeeAmount(currency) {
  const defaultValue = DEFAULT_NETWORK_FEES[currency] ?? DEFAULT_NETWORK_FEES.USDT;
  return Number(await getConfigValue(`withdrawal.networkFeeAmount.${currency}`, defaultValue));
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function matchesStoredPin(storedPin, submittedPin) {
  if (!storedPin || !submittedPin) return false;
  return storedPin === hashPin(submittedPin) || storedPin === submittedPin;
}

// Simulate withdrawal request
router.post('/', auth, async (req, res) => {
  try {
    console.log('[WITHDRAWAL API] Incoming request:', req.body);
    const { amount, currency, network, address, pin } = req.body;
    const userId = req.user.id;

    const addressInput = String(address || '').trim();
    const pinInput = String(pin || '').trim();

    if (!currency || !network || !addressInput || !pinInput) {
      return res.status(400).json({ msg: 'Please provide all required fields including PIN' });
    }

    const requestedAmount = Number(amount);
    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({ msg: 'Please provide a valid withdrawal amount greater than 0.' });
    }

    const currencyInput = String(currency).toUpperCase();
    const networkInput = String(network).toUpperCase();

    const user = await User.findById(userId).select('+withdrawalPin');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!matchesStoredPin(user.withdrawalPin, pinInput)) {
      return res.status(400).json({ msg: 'Invalid withdrawal PIN' });
    }

    const requestedCurrency = 'USD';
    let cryptoCurrency = '';
    let cryptoAmount = 0;
    let conversionRate = 1;

    // Fetch live rates
    const rates = await getCryptoUSDPrices();

    if (currencyInput === 'BTC' || networkInput === 'BTC') {
      conversionRate = rates.BTC;
      cryptoAmount = requestedAmount / conversionRate;
      cryptoCurrency = 'BTC';
    } else if (currencyInput === 'ETH' || networkInput === 'ETH') {
      conversionRate = rates.ETH;
      cryptoAmount = requestedAmount / conversionRate;
      cryptoCurrency = 'ETH';
    } else if (currencyInput === 'BNB' || networkInput === 'BEP20') {
      conversionRate = rates.BNB;
      cryptoAmount = requestedAmount / conversionRate;
      cryptoCurrency = 'BNB';
    } else if (currencyInput === 'USDT' || ['ERC20', 'TRC20', 'BEP20'].includes(networkInput)) {
      conversionRate = rates.USDT;
      cryptoAmount = requestedAmount / conversionRate;
      cryptoCurrency = 'USDT';
    } else {
      return res.status(400).json({ msg: 'Unsupported currency or network.' });
    }

    // Check user balance (in USD) - use availableBalance which includes ROI
    const activationFeeAmount = await getActivationFeeAmount();
    if (user.availableBalance < requestedAmount + activationFeeAmount) {
      return res.status(400).json({ msg: `Insufficient balance for withdrawal. Please keep at least $${activationFeeAmount} available to cover the activation fee.` });
    }

    user.availableBalance -= requestedAmount;
    await user.save();

    const newWithdrawal = new Withdrawal({
      type: 'regular',
      userId: userId,
      amount: requestedAmount,
      reservedAmount: requestedAmount,
      currency: cryptoCurrency,
      network: networkInput,
      walletAddress: addressInput,
      status: 'awaiting_activation_fee',
      activationFeeAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newWithdrawal.save();

    const cryptoAmountDisplay = cryptoAmount ? cryptoAmount.toFixed(8) : '0';

    console.log('[WITHDRAWAL API] Returning:', {
      requestedAmount,
      requestedCurrency,
      cryptoAmount: cryptoAmountDisplay,
      cryptoCurrency,
      conversionRate
    });
    res.json({
      success: true,
      msg: 'Withdrawal request created and awaiting activation fee.',
      withdrawal: newWithdrawal,
      requestedAmount,
      requestedCurrency,
      cryptoAmount: cryptoAmountDisplay,
      cryptoCurrency,
      conversionRate
    });
  } catch (err) {
    console.error('[WITHDRAWAL API] Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Set or update withdrawal PIN
router.post('/set-withdrawal-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!/^[0-9]{6}$/.test(pin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+withdrawalPin');
    if (!user) {
      console.error('User not found for PIN set:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    user.withdrawalPin = hashPin(pin);
    user.markModified('withdrawalPin');
    await user.save();
    console.log(`[WITHDRAWAL PIN] Saved PIN for user ${req.user.id}`);
    res.json({ success: true, msg: 'Withdrawal PIN set successfully.' });
  } catch (err) {
    console.error('Error setting withdrawal PIN:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Request PIN reset (send email code)
router.post('/request-pin-reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.pinResetCode = code;
    user.pinResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Withdrawal PIN Reset Code',
      text: `Your withdrawal PIN reset code is: ${code}`
    });
    res.json({ success: true, msg: 'PIN reset code sent to your email.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset PIN with code
router.post('/reset-pin', auth, async (req, res) => {
  try {
    const { code, newPin } = req.body;
    if (!/^[0-9]{6}$/.test(newPin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+pinResetCode +pinResetExpiry');
    if (!user || !user.pinResetCode || !user.pinResetExpiry) {
      return res.status(400).json({ msg: 'No reset request found.' });
    }
    if (user.pinResetCode !== code || user.pinResetExpiry < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired code.' });
    }
    user.withdrawalPin = hashPin(newPin);
    user.pinResetCode = undefined;
    user.pinResetExpiry = undefined;
    await user.save();
    res.json({ success: true, msg: 'Withdrawal PIN reset successfully.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify withdrawal PIN endpoint
router.post('/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!/^[0-9]{6}$/.test(pin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+withdrawalPin');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (!matchesStoredPin(user.withdrawalPin, pin)) {
      return res.status(400).json({ msg: 'Invalid withdrawal PIN' });
    }
    res.json({ success: true, msg: 'PIN is valid.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

async function refreshWithdrawalProcessingStatus(withdrawal) {
  if (!withdrawal) return withdrawal;
  if (withdrawal.status !== 'withdrawal_processing' || !withdrawal.processingStartedAt) {
    return withdrawal;
  }

  const elapsedMillis = Date.now() - withdrawal.processingStartedAt.getTime();
  const processingWindowMillis = 20 * 60 * 1000;
  if (elapsedMillis >= processingWindowMillis) {
    withdrawal.status = 'awaiting_network_fee';
    await withdrawal.save();
  }

  return withdrawal;
}

function getNetworkFeeLabel(currency) {
  return currency === 'ETH' ? 'Low Gas Fee' : 'Low Miner\'s Fee';
}

router.post('/:withdrawalId/pay-activation-fee', auth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
    }
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (!['awaiting_activation_fee', 'activation_fee_rejected', 'activation_fee_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ success: false, error: 'Activation fee cannot be paid at this stage.' });
    }

    const feePaid = Number(req.body.fee);
    if (!feePaid || feePaid <= 0) {
      return res.status(400).json({ success: false, error: 'A valid activation fee amount is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const defaultActivationFee = await getActivationFeeAmount();
    withdrawal.activationFeeAmount = withdrawal.activationFeeAmount || defaultActivationFee;
    const remainingFee = Math.max(withdrawal.activationFeeAmount - (withdrawal.activationFeePaid || 0), 0);
    if (remainingFee === 0) {
      return res.status(400).json({ success: false, error: 'Activation fee is already fully paid. Please wait for admin approval.' });
    }
    if (feePaid > remainingFee) {
      return res.status(400).json({ success: false, error: `Please pay the remaining activation fee amount of $${remainingFee.toFixed(2)}.` });
    }

    if ((user.availableBalance || 0) < feePaid) {
      return res.status(400).json({ success: false, error: 'Insufficient available balance for activation fee.' });
    }

    user.availableBalance -= feePaid;
    await user.save();

    withdrawal.activationFeePaid = (withdrawal.activationFeePaid || 0) + feePaid;
    withdrawal.activationFeePaidAt = new Date();
    withdrawal.status = 'activation_fee_paid';
    await withdrawal.save();

    return res.json({
      success: true,
      message: 'Activation fee payment received. Waiting for admin approval.',
      withdrawal: {
        id: withdrawal._id.toString(),
        status: withdrawal.status,
        activationFeeAmount: withdrawal.activationFeeAmount,
        activationFeePaid: withdrawal.activationFeePaid
      },
      availableBalance: user.availableBalance
    });
  } catch (err) {
    console.error('[WITHDRAWAL] pay-activation-fee error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/:withdrawalId/submit-form', auth, async (req, res) => {
  try {
    const { walletAddress, currency, network, pin } = req.body;
    if (!walletAddress || !currency || !network || !pin) {
      return res.status(400).json({ success: false, error: 'Wallet address, currency, network, and withdrawal PIN are required.' });
    }

    if (!/^[0-9]{6}$/.test(String(pin))) {
      return res.status(400).json({ success: false, error: 'Withdrawal PIN must be exactly 6 digits.' });
    }

    const currencyInput = String(currency).toUpperCase();
    const networkInput = String(network).toUpperCase();

    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
    }
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (withdrawal.status !== 'activation_fee_approved') {
      return res.status(400).json({ success: false, error: 'Withdrawal form is not available until the activation fee is approved.' });
    }

    const user = await User.findById(req.user.id).select('+withdrawalPin');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (!matchesStoredPin(user.withdrawalPin, String(pin).trim())) {
      return res.status(400).json({ success: false, error: 'Invalid withdrawal PIN.' });
    }

    const taxPercent = await getInterestTaxPercent();
    const interestTaxAmount = Number(((user.availableBalance || 0) * taxPercent / 100).toFixed(2));

    withdrawal.walletAddress = String(walletAddress).trim();
    withdrawal.currency = currencyInput;
    withdrawal.network = networkInput;
    withdrawal.interestTaxAmount = interestTaxAmount;
    withdrawal.networkFeeAmount = await getNetworkFeeAmount(currencyInput);
    withdrawal.status = 'awaiting_interest_tax';
    await withdrawal.save();

    return res.json({
      success: true,
      message: 'Withdrawal form submitted. Interest income tax has been calculated.',
      withdrawal: {
        id: withdrawal._id.toString(),
        status: withdrawal.status,
        interestTaxAmount,
        networkFeeAmount: withdrawal.networkFeeAmount,
        networkFeeLabel: getNetworkFeeLabel(currencyInput)
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL] submit-form error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/:withdrawalId/pay-interest-tax', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'A valid tax payment amount is required.' });
    }

    const withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
    }
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    if (!['awaiting_interest_tax', 'interest_tax_rejected', 'interest_tax_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ success: false, error: 'Interest tax cannot be paid at this stage.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const remainingTax = Math.max((withdrawal.interestTaxAmount || 0) - (withdrawal.interestTaxPaid || 0), 0);
    if (remainingTax === 0) {
      return res.status(400).json({ success: false, error: 'Interest tax is already fully paid. Please wait for admin approval.' });
    }
    if (amount > remainingTax) {
      return res.status(400).json({ success: false, error: `Please pay the remaining tax amount of $${remainingTax.toFixed(2)}.` });
    }

    if ((user.availableBalance || 0) < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient available balance for interest tax.' });
    }

    user.availableBalance -= amount;
    await user.save();

    withdrawal.interestTaxPaid = (withdrawal.interestTaxPaid || 0) + amount;
    withdrawal.interestTaxPaidAt = new Date();
    withdrawal.status = 'interest_tax_paid';
    await withdrawal.save();

    return res.json({
      success: true,
      message: 'Interest income tax payment received.',
      withdrawal: {
        id: withdrawal._id.toString(),
        status: withdrawal.status,
        interestTaxPaid: withdrawal.interestTaxPaid,
        interestTaxAmount: withdrawal.interestTaxAmount
      },
      availableBalance: user.availableBalance
    });
  } catch (err) {
    console.error('[WITHDRAWAL] pay-interest-tax error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/:withdrawalId/pay-network-fee', auth, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'A valid network fee amount is required.' });
    }

    let withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
    }
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    withdrawal = await refreshWithdrawalProcessingStatus(withdrawal);
    if (!['awaiting_network_fee', 'network_fee_rejected', 'network_fee_paid'].includes(withdrawal.status)) {
      return res.status(400).json({ success: false, error: 'Network fee cannot be paid at this stage.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const remainingNetworkFee = Math.max((withdrawal.networkFeeAmount || 0) - (withdrawal.networkFeePaid || 0), 0);
    if (remainingNetworkFee === 0) {
      return res.status(400).json({ success: false, error: 'Network fee is already fully paid. Please wait for admin approval.' });
    }
    if (amount > remainingNetworkFee) {
      return res.status(400).json({ success: false, error: `Please pay the remaining network fee amount of $${remainingNetworkFee.toFixed(2)}.` });
    }

    if ((user.availableBalance || 0) < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient available balance for network fee.' });
    }

    user.availableBalance -= amount;
    await user.save();

    withdrawal.networkFeeAmount = withdrawal.networkFeeAmount || amount;
    withdrawal.networkFeePaid = (withdrawal.networkFeePaid || 0) + amount;
    withdrawal.networkFeePaidAt = new Date();
    withdrawal.status = 'network_fee_paid';
    await withdrawal.save();

    return res.json({
      success: true,
      message: 'Network fee payment received.',
      withdrawal: {
        id: withdrawal._id.toString(),
        status: withdrawal.status,
        networkFeePaid: withdrawal.networkFeePaid,
        networkFeeAmount: withdrawal.networkFeeAmount
      },
      availableBalance: user.availableBalance
    });
  } catch (err) {
    console.error('[WITHDRAWAL] pay-network-fee error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user.id }).sort('-createdAt');
    const refreshed = await Promise.all(withdrawals.map(async w => await refreshWithdrawalProcessingStatus(w)));
    return res.json({ success: true, withdrawals: refreshed });
  } catch (err) {
    console.error('[WITHDRAWAL] list error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/:withdrawalId', auth, async (req, res) => {
  try {
    let withdrawal = await Withdrawal.findById(req.params.withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Withdrawal not found.' });
    }
    if (withdrawal.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    withdrawal = await refreshWithdrawalProcessingStatus(withdrawal);
    return res.json({ success: true, withdrawal });
  } catch (err) {
    console.error('[WITHDRAWAL] get withdrawal error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;