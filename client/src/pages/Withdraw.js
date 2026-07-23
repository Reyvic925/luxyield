// src/pages/Withdraw.js
import React, { useState, useEffect, useCallback } from 'react';
import WithdrawalHistory from '../components/WithdrawalHistory';
import { useUser } from '../contexts/UserContext';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';
import axios from '../utils/axios';
import {
  getUserWithdrawals,
  payActivationFee,
  submitWithdrawalForm,
  payInterestTax,
  payNetworkFee,
} from '../services/userWithdrawalAPI';

const statusLabels = {
  pending: 'Pending Withdrawal Request',
  awaiting_activation_fee: 'Awaiting Activation Fee',
  activation_fee_paid: 'Activation Fee Paid — Awaiting Admin Review',
  activation_fee_rejected: 'Activation Fee Rejected',
  activation_fee_approved: 'Activation Fee Approved',
  awaiting_interest_tax: 'Awaiting Interest Income Tax',
  interest_tax_paid: 'Interest Tax Paid — Awaiting Admin Review',
  interest_tax_rejected: 'Interest Tax Rejected',
  withdrawal_processing: 'Withdrawal Processing',
  awaiting_network_fee: 'Awaiting Network Fee',
  network_fee_paid: 'Network Fee Paid — Awaiting Admin Review',
  withdrawal_successful: 'Withdrawal Successful',
  completed: 'Completed',
  rejected: 'Rejected',
  failed: 'Failed',
};

const statusDescriptions = {
  pending: 'Your withdrawal request has been received and is ready for activation fee payment.',
  awaiting_activation_fee: 'Your withdrawal request is waiting for the activation fee. Pay the fee from your available balance to unlock the reserved funds from your locked balance.',
  activation_fee_paid: 'Your activation fee has been paid. Waiting for admin approval before wallet details become available.',
  activation_fee_rejected: 'The activation fee payment was rejected. The funds remain locked and you can retry payment once the full activation fee is available.',
  activation_fee_approved: 'Activation fee approved. Enter your wallet address, cryptocurrency, and withdrawal PIN to continue.',
  awaiting_interest_tax: 'The system calculated the interest income tax for this withdrawal. Pay the tax to continue.',
  interest_tax_paid: 'Interest tax payment received. Waiting for admin approval to begin processing.',
  interest_tax_rejected: 'Interest tax payment was rejected. Complete the remaining payment and resubmit.',
  withdrawal_processing: 'Your withdrawal is processing for the designated review window. After this period the network fee stage will become available.',
  awaiting_network_fee: 'A blockchain network fee is required to complete the withdrawal. Pay it from your available balance when prompted.',
  network_fee_paid: 'Network fee payment received. Waiting for admin verification to finalize the withdrawal.',
  withdrawal_successful: 'Your withdrawal has been finalized and sent to your wallet address.',
  completed: 'Withdrawal completed.',
  rejected: 'Withdrawal rejected by the admin.',
  failed: 'Withdrawal failed. Please contact support.',
};

const networks = [
  { id: 'BTC', name: 'Bitcoin (BTC)', currencies: ['BTC'] },
  { id: 'ETH', name: 'Ethereum (ETH)', currencies: ['ETH'] },
  { id: 'ERC20', name: 'USDT on ERC20 (Ethereum)', currencies: ['USDT'] },
  { id: 'TRC20', name: 'USDT on TRC20 (Tron)', currencies: ['USDT'] },
  { id: 'BEP20', name: 'USDT on BEP20 (Binance Smart Chain)', currencies: ['USDT'] },
];

const activeStatuses = new Set([
  'pending',
  'awaiting_activation_fee',
  'activation_fee_paid',
  'activation_fee_rejected',
  'activation_fee_approved',
  'awaiting_interest_tax',
  'interest_tax_paid',
  'interest_tax_rejected',
  'withdrawal_processing',
  'awaiting_network_fee',
  'network_fee_paid',
]);

const getNetworkFeeLabel = (currency, network) => {
  if (currency === 'ETH' || network === 'ETH' || network === 'ERC20') {
    return 'Low Gas Fee';
  }
  return "Low Miner's Fee";
};

function validateWalletAddress(address, network) {
  if (!address) return false;
  switch (network) {
    case 'BTC':
      return (
        (address.startsWith('1') && address.length >= 26 && address.length <= 35) ||
        (address.startsWith('3') && address.length >= 26 && address.length <= 35) ||
        (address.toLowerCase().startsWith('bc1') && address.length >= 42 && address.length <= 62)
      );
    case 'ERC20':
    case 'BEP20':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'TRC20':
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    default:
      return false;
  }
}

const Withdraw = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeWithdrawal, setActiveWithdrawal] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ERC20');
  const [currency, setCurrency] = useState('USDT');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const { kycStatus } = useUser();
  const { refreshUserData } = useUserDataRefresh();

  const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred.';
    if (error.response && error.response.data) {
      return error.response.data.msg || error.response.data.error || error.response.data.message || error.message;
    }
    return error.message || String(error);
  };

  useEffect(() => {
    if (selectedNetwork === 'BTC') setCurrency('BTC');
    else if (selectedNetwork === 'ETH') setCurrency('ETH');
    else if (selectedNetwork === 'ERC20') setCurrency('USDT');
    else if (selectedNetwork === 'TRC20') setCurrency('USDT');
    else if (selectedNetwork === 'BEP20') setCurrency('USDT');
  }, [selectedNetwork]);

  const findActiveWithdrawal = (items) => {
    if (!Array.isArray(items)) return null;
    return items
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .find((w) => activeStatuses.has(w.status));
  };

  const refreshBalances = useCallback(async () => {
    try {
      const response = await axios.get('/api/portfolio');
      setAvailableBalance(response.data.userInfo?.availableBalance ?? 0);
      setLockedBalance(response.data.userInfo?.lockedBalance ?? 0);
    } catch (err) {
      console.error('[WITHDRAW] Failed to refresh balances:', err);
    }
  }, []);

  const refreshWithdrawals = useCallback(async () => {
    try {
      const data = await getUserWithdrawals();
      setWithdrawals(data);
      setActiveWithdrawal(findActiveWithdrawal(data));
      if (!data || data.length === 0) {
        setActiveWithdrawal(null);
      }
    } catch (err) {
      console.error('[WITHDRAW] Failed to fetch user withdrawals:', err);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([refreshBalances(), refreshWithdrawals()]);
      setLoading(false);
    };
    initialize();
  }, [refreshBalances, refreshWithdrawals]);

  useEffect(() => {
    if (!activeWithdrawal) {
      setWalletAddress('');
      setWithdrawPin('');
      return;
    }
    if (activeWithdrawal.walletAddress) {
      setWalletAddress(activeWithdrawal.walletAddress);
    }
    if (activeWithdrawal.network) {
      setSelectedNetwork(activeWithdrawal.network);
    }
    if (activeWithdrawal.currency) {
      setCurrency(activeWithdrawal.currency);
    }
  }, [activeWithdrawal]);

  const remainingActivationFee = activeWithdrawal ? Math.max((activeWithdrawal.activationFeeAmount || 10) - (activeWithdrawal.activationFeePaid || 0), 0) : 0;
  const remainingInterestTax = activeWithdrawal ? Math.max((activeWithdrawal.interestTaxAmount || 0) - (activeWithdrawal.interestTaxPaid || 0), 0) : 0;
  const remainingNetworkFee = activeWithdrawal ? Math.max((activeWithdrawal.networkFeeAmount || 0) - (activeWithdrawal.networkFeePaid || 0), 0) : 0;

  const handlePayActivationFee = async () => {
    if (!activeWithdrawal) return;
    setActionError('');
    setActionLoading(true);
    try {
      const fee = remainingActivationFee;
      if (!fee || fee <= 0) {
        setActionError('Activation fee is already fully paid. Please wait for admin approval.');
      } else {
        await payActivationFee(activeWithdrawal._id || activeWithdrawal.id, fee);
        await Promise.all([refreshBalances(), refreshWithdrawals(), refreshUserData()]);
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };


  const handleSubmitWithdrawalForm = async () => {
    if (!activeWithdrawal) return;
    if (activeWithdrawal.status !== 'activation_fee_approved') {
      setActionError('Withdrawal form is only available after admin approval of the activation fee.');
      return;
    }
    if (!validateWalletAddress(walletAddress, selectedNetwork)) {
      setActionError('Please enter a valid wallet address for the selected network.');
      return;
    }
    if (!/^[0-9]{6}$/.test(withdrawPin)) {
      setActionError('Please enter a valid 6-digit withdrawal PIN.');
      return;
    }
    setActionError('');
    setActionLoading(true);
    try {
      await submitWithdrawalForm(activeWithdrawal._id || activeWithdrawal.id, {
        walletAddress,
        currency,
        network: selectedNetwork,
        pin: withdrawPin,
      });
      setWithdrawPin('');
      await Promise.all([refreshWithdrawals(), refreshUserData()]);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayInterestTax = async () => {
    if (!activeWithdrawal || !activeWithdrawal.interestTaxAmount) return;
    setActionError('');
    setActionLoading(true);
    try {
      const tax = remainingInterestTax;
      if (!tax || tax <= 0) {
        setActionError('Interest tax is already fully paid. Please wait for admin approval.');
      } else {
        await payInterestTax(activeWithdrawal._id || activeWithdrawal.id, tax);
        await Promise.all([refreshBalances(), refreshWithdrawals(), refreshUserData()]);
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayNetworkFee = async () => {
    if (!activeWithdrawal || !activeWithdrawal.networkFeeAmount) return;
    setActionError('');
    setActionLoading(true);
    try {
      const fee = remainingNetworkFee;
      if (!fee || fee <= 0) {
        setActionError('Network fee is already fully paid. Please wait for admin approval.');
      } else {
        await payNetworkFee(activeWithdrawal._id || activeWithdrawal.id, fee);
        await Promise.all([refreshBalances(), refreshWithdrawals(), refreshUserData()]);
      }
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionPanel = () => {
    if (!activeWithdrawal) {
      return (
        <div className="glassmorphic p-6 rounded-xl bg-gray-900 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">Withdrawal Center</h3>
          <p className="text-gray-400 mb-4">
            No active staged withdrawal request was found. When an investment plan completes, the returned funds move into your locked balance.
            Use the investment details page to initiate the withdrawal. Then return here to pay the activation fee, submit wallet details,
            and complete the interest tax and network fee steps.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Locked Balance</p>
            <p className="text-white text-3xl font-semibold mt-2">${lockedBalance.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-2">Funds from completed investments are held here until withdrawal is unlocked.</p>
          </div>
        </div>
      );
    }

    const status = activeWithdrawal.status;
    const feeLabel = getNetworkFeeLabel(activeWithdrawal.currency, activeWithdrawal.network);
    const activationFeeFullyPaid = remainingActivationFee === 0 && ['activation_fee_paid', 'activation_fee_rejected'].includes(status);
    const interestTaxFullyPaid = remainingInterestTax === 0 && ['interest_tax_paid', 'interest_tax_rejected'].includes(status);
    const networkFeeFullyPaid = remainingNetworkFee === 0 && ['network_fee_paid', 'network_fee_rejected'].includes(status);
    const canPayActivation = ['awaiting_activation_fee', 'activation_fee_rejected', 'activation_fee_paid'].includes(status) && !activationFeeFullyPaid;
    const canPayTax = ['awaiting_interest_tax', 'interest_tax_rejected', 'interest_tax_paid'].includes(status) && !interestTaxFullyPaid;
    const canPayNetwork = ['awaiting_network_fee', 'network_fee_rejected', 'network_fee_paid'].includes(status) && !networkFeeFullyPaid;
    const showWalletForm = status === 'activation_fee_approved';

    return (
      <div className="glassmorphic p-6 rounded-xl bg-gray-900 border border-gray-700">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-gray-400">Current Withdrawal Stage</p>
              <h3 className="text-2xl font-bold mt-2 text-white">{statusLabels[status] || status}</h3>
            </div>
            <div className="px-3 py-2 rounded-full bg-gray-800 text-sm text-gray-200">
              Withdrawal
            </div>          </div>
          <p className="text-gray-400 mt-3 max-w-2xl">{statusDescriptions[status] || 'Follow the prompts to complete your withdrawal.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Requested Amount</p>
            <p className="text-white text-3xl font-semibold mt-2">${activeWithdrawal.amount?.toFixed(2) ?? '0.00'}</p>
            <p className="text-gray-500 text-sm mt-2">
              Reserved from your withdrawal request balance.
            </p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm">Available Balance</p>
            <p className="text-white text-3xl font-semibold mt-2">${availableBalance.toFixed(2)}</p>
            <p className="text-gray-500 text-sm mt-2">Used for fees and verification</p>
          </div>
        </div>

        {actionError && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
            {actionError}
          </div>
        )}

        {canPayActivation && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Activation Fee</p>
                  <p className="text-white font-semibold text-2xl mt-2">${activeWithdrawal.activationFeeAmount ?? 10}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>Verification fee charged from your available balance.</p>
                  <p className="mt-1 text-xs text-gray-500">This fee is required to unlock the withdrawal request and begin the next stage.</p>
                </div>
              </div>
            </div>
            {activationFeeFullyPaid ? (
              <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 text-gray-300 mb-4">
                <p className="text-sm">Activation fee fully paid.</p>
                <p className="text-sm text-gray-400">Waiting for admin review to approve your withdrawal form stage.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePayActivationFee}
                  disabled={actionLoading || availableBalance < remainingActivationFee}
                  className={`w-full py-3 rounded-lg font-bold ${actionLoading || availableBalance < remainingActivationFee ? 'bg-gray-700 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-600'}`}
                >
                  {actionLoading ? 'Processing...' : `Pay Activation Fee ($${remainingActivationFee.toFixed(2)})`}
                </button>
                {availableBalance < remainingActivationFee && (
                  <p className="text-red-400 text-sm">Insufficient available balance to pay the remaining activation fee.</p>
                )}
              </>
            )}
          </div>
        )}

        {showWalletForm && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Withdrawal details</p>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="text-gray-400 text-sm">Network</span>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className="w-full mt-2 bg-dark border border-gray-700 rounded-lg py-3 px-4 focus:border-gold focus:outline-none"
                  >
                    {networks.map((network) => (
                      <option key={network.id} value={network.id}>{network.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-gray-400 text-sm">Wallet Address</span>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder={selectedNetwork === 'BTC' ? 'e.g. 1A1zP1...' : selectedNetwork === 'ERC20' ? 'e.g. 0x...' : selectedNetwork === 'TRC20' ? 'e.g. T...' : 'e.g. 0x...'}
                    className="w-full mt-2 bg-dark border border-gray-700 rounded-lg py-3 px-4 focus:border-gold focus:outline-none"
                  />
                  {!validateWalletAddress(walletAddress, selectedNetwork) && walletAddress && (
                    <p className="text-red-400 text-xs mt-2">Invalid wallet address for selected network.</p>
                  )}
                </label>
 
                <label className="block">
                  <span className="text-gray-400 text-sm">Withdrawal PIN</span>
                  <input
                    type="password"
                    value={withdrawPin}
                    onChange={(e) => setWithdrawPin(e.target.value)}
                    placeholder="Enter your 6-digit withdrawal PIN"
                    maxLength={6}
                    className="w-full mt-2 bg-dark border border-gray-700 rounded-lg py-3 px-4 focus:border-gold focus:outline-none"
                  />
                  {withdrawPin && !/^[0-9]{6}$/.test(withdrawPin) && (
                    <p className="text-red-400 text-xs mt-2">PIN must be exactly 6 digits.</p>
                  )}
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmitWithdrawalForm}
              disabled={actionLoading || !walletAddress || !validateWalletAddress(walletAddress, selectedNetwork) || !/^[0-9]{6}$/.test(withdrawPin)}
              className={`w-full py-3 rounded-lg font-bold ${actionLoading || !walletAddress || !validateWalletAddress(walletAddress, selectedNetwork) || !/^[0-9]{6}$/.test(withdrawPin) ? 'bg-gray-700 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-600'}`}
            >
              {actionLoading ? 'Submitting...' : 'Submit Withdrawal Form'}
            </button>
          </div>
        )}
        {status === 'activation_fee_paid' && (
          <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 mb-6 text-gray-300">
            <p className="text-sm">Activation fee payment has been received.</p>
            <p className="text-sm text-gray-400">Please wait for admin approval before wallet address, network, and PIN fields become available.</p>
          </div>
        )}

        {canPayTax && activeWithdrawal.interestTaxAmount > 0 && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Interest Income Tax</p>
              <p className="text-white font-semibold text-2xl mt-2">${activeWithdrawal.interestTaxAmount?.toFixed(2) ?? '0.00'}</p>
              <p className="text-gray-500 text-sm mt-2">Tax is calculated on your available balance.</p>
            </div>
            {interestTaxFullyPaid ? (
              <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 text-gray-300 mb-4">
                <p className="text-sm">Interest tax fully paid.</p>
                <p className="text-sm text-gray-400">Waiting for admin review to continue withdrawal processing.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePayInterestTax}
                  disabled={actionLoading || availableBalance < remainingInterestTax}
                  className={`w-full py-3 rounded-lg font-bold ${actionLoading || availableBalance < remainingInterestTax ? 'bg-gray-700 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-600'}`}
                >
                  {actionLoading ? 'Processing...' : `Pay Interest Income Tax ($${remainingInterestTax?.toFixed(2) ?? '0.00'})`}
                </button>
                {availableBalance < remainingInterestTax && (
                  <p className="text-red-400 text-sm">Insufficient available balance to pay the remaining tax.</p>
                )}
              </>
            )}
          </div>
        )}

        {status === 'withdrawal_processing' && (
          <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 mb-6">
            <p className="text-gray-400 text-sm">This withdrawal is currently processing.</p>
            <p className="text-white font-semibold mt-3">Please wait until the processing period ends and the network fee stage opens.</p>
          </div>
        )}

        {canPayNetwork && activeWithdrawal.networkFeeAmount > 0 && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-850 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">{feeLabel}</p>
              <p className="text-white font-semibold text-2xl mt-2">${activeWithdrawal.networkFeeAmount?.toFixed(2) ?? '0.00'}</p>
              <p className="text-gray-500 text-sm mt-2">This fee is required to send the withdrawal over the selected blockchain network.</p>
            </div>
            {networkFeeFullyPaid ? (
              <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 text-gray-300 mb-4">
                <p className="text-sm">Network fee fully paid.</p>
                <p className="text-sm text-gray-400">Waiting for admin review to finalize your withdrawal.</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePayNetworkFee}
                  disabled={actionLoading || availableBalance < remainingNetworkFee}
                  className={`w-full py-3 rounded-lg font-bold ${actionLoading || availableBalance < remainingNetworkFee ? 'bg-gray-700 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-600'}`}
                >
                  {actionLoading ? 'Processing...' : `Pay ${feeLabel} ($${remainingNetworkFee?.toFixed(2) ?? '0.00'})`}
                </button>
                {availableBalance < remainingNetworkFee && (
                  <p className="text-red-400 text-sm">Insufficient available balance to pay the remaining network fee.</p>
                )}
              </>
            )}
          </div>
        )}

        {status === 'withdrawal_successful' && (
          <div className="bg-green-900 bg-opacity-20 p-4 rounded-lg border border-green-700 mb-6">
            <p className="text-green-200">Your withdrawal has been successfully finalized. Funds should now be on the selected wallet address.</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 p-4 sm:p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (kycStatus !== 'verified') {
    return (
      <div className="glassmorphic p-4 sm:p-8 rounded-xl text-center mt-6 sm:mt-10 overflow-auto">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">KYC Required</h2>
        <p className="text-white mb-4">You must complete KYC verification before you can withdraw funds.</p>
        <a href="/dashboard/kyc" className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition">Go to KYC Verification</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto p-2 sm:p-4 overflow-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Withdrawal Center</h1>
          <p className="text-gray-400 mt-2">Manage your staged withdrawal requests, activation fees, tax payments, and network fees in one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm uppercase tracking-[0.24em] mb-2">Available Balance</p>
          <p className="text-3xl font-semibold text-white">${availableBalance.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-sm uppercase tracking-[0.24em] mb-2">Locked Balance</p>
          <p className="text-3xl font-semibold text-white">${lockedBalance.toLocaleString()}</p>
        </div>
      </div>

      {renderActionPanel()}

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>
        <WithdrawalHistory withdrawals={withdrawals} />
      </div>
    </div>
  );
};

export default Withdraw;

