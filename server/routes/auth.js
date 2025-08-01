const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const axios = require('axios');
const { sendMail } = require('../utils/mailer');
const crypto = require('crypto');
const bitcoin = require('bitcoinjs-lib');
const ethers = require('ethers');
// Robust TronWeb import for all export styles
const tronwebPkg = require('tronweb');
let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
const solanaWeb3 = require('@solana/web3.js');
const bip39 = require('bip39');
const fs = require('fs');
const auth = require('../middleware/auth');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const { logDeviceHistory } = require('./user');

// Multer storage config for KYC uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper: verify Google reCAPTCHA
async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const url = `https://www.google.com/recaptcha/api/siteverify`;
  const response = await axios.post(url, null, {
    params: { secret, response: token }
  });
  return response.data.success;
}

// Register route
router.post('/register', async (req, res) => {
  console.log('REGISTER ENDPOINT HIT');
  console.log('Registration request body:', req.body);
  try {
    const {
      fullName,
      username,
      email,
      phone,
      country,
      securityQuestion,
      securityAnswer,
      password,
      referralCode
    } = req.body;

    // Check if user or pending user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    let pending = await PendingUser.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // If pending registration exists, update it with new data and resend verification
    // Otherwise, create a new pending registration
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const registrationData = {
      name: fullName,
      username,
      email,
      phone,
      country,
      securityQuestion,
      securityAnswer,
      password: hashedPassword,
      referralCode: referralCode || null,
      registrationIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    };
    // Generate new email verification token and OTP
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    if (pending) {
      // Update existing pending registration with all fields
      pending.registrationData = {
        ...pending.registrationData, // fallback to previous data if any
        ...registrationData // overwrite with new data
      };
      pending.emailVerificationToken = emailToken;
      pending.emailVerificationTokenExpiry = expiry;
      pending.emailOtp = emailOtp;
      pending.emailOtpExpiry = expiry;
      await pending.save();
      console.log('Updated PendingUser:', pending);
    } else {
      const newPending = await PendingUser.create({
        registrationData,
        email,
        emailVerificationToken: emailToken,
        emailVerificationTokenExpiry: expiry,
        emailOtp,
        emailOtpExpiry: expiry
      });
      console.log('Created PendingUser:', newPending);
    }
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${emailToken}`;
    await sendMail({
      to: email,
      subject: 'Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Verify Your Email</h2>
        <p style="margin:24px 0;">Click the button below to verify your email address and complete registration, or use the OTP code below.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#FFD700;color:#18181b;font-weight:bold;border-radius:8px;text-decoration:none;margin:16px 0;">Verify Email</a>
        <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${emailOtp}</span></p>
        <p style="margin-top:24px;font-size:13px;color:#aaa;">If you did not create an account, you can ignore this email.</p>
      </div>`
    });
    res.json({ message: 'Registration started. Please verify your email.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login route
router.post('/login', logDeviceHistory, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      console.warn(`Login failed: No user found for email ${email}`);
      return res.status(400).json({ message: 'No account found for this email.' });
    }
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Incorrect password for email ${email}`);
      return res.status(400).json({ message: 'Incorrect password.' });
    }
    // Log device history manually since req.user is not set yet
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const agent = useragent.parse(req.headers['user-agent']);
      const geo = geoip.lookup(ip) || {};
      const browser = agent.family + ' ' + agent.major;
      const device = agent.device.family;
      const deviceEntry = {
        date: new Date().toISOString(),
        ip,
        browser,
        device,
        location: geo.city ? `${geo.city}, ${geo.country}` : geo.country || '-',
        status: 'Success',
        lastActive: new Date().toISOString()
      };
      // Remove any existing session for this device/browser
      await User.findByIdAndUpdate(user.id, {
        $pull: { deviceHistory: { browser, device } }
      });
      // Add the new session
      await User.findByIdAndUpdate(user.id, { $push: { deviceHistory: deviceEntry } });
    } catch (e) {
      console.error('Failed to log device history:', e);
    }
    // Create token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: 'Login successful.' });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).send('Server error');
  }
});

// KYC upload endpoint
router.post('/kyc/upload', auth, upload.fields([
  { name: 'id', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!req.files['id'] || !req.files['selfie']) {
      return res.status(400).json({ message: 'ID and selfie are required.' });
    }

    user.kyc = {
      ...user.kyc,
      idUrl: '/uploads/kyc/' + req.files['id'][0].filename,
      selfieUrl: '/uploads/kyc/' + req.files['selfie'][0].filename,
      country: req.body.country || user.kyc.country,
      status: 'pending',
      rejectionReason: ''
    };
    await user.save();
    res.json({ message: 'KYC documents uploaded successfully', kyc: user.kyc });
  } catch (err) {
    console.error('KYC upload error:', err);
    res.status(500).send('Server error');
  }
});

// KYC status endpoint
router.get('/kyc/status', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ kyc: user.kyc, isEmailVerified: user.isEmailVerified });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password: send reset link (now also sends 6-digit OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If the email exists, a reset link and OTP have been sent.' });
    // Generate secure token for link
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    // Generate 6-digit OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = expiry;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Reset Your Password</h2>
        <p style="margin:24px 0;">Click the button below to reset your password. This link and OTP will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#FFD700;color:#18181b;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;">Reset Password</a>
        <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${otp}</span></p>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">If you did not request this, you can ignore this email.</p>
      </div>`
    });
    res.json({ message: 'If the email exists, a reset link and OTP have been sent.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset Password: handle reset (accepts either token or OTP)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    let user = await User.findOne({ passwordResetToken: token, passwordResetExpiry: { $gt: Date.now() } });
    if (!user) {
      // Try OTP fallback
      user = await User.findOne({ passwordResetOtp: token, passwordResetOtpExpiry: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ message: 'Invalid or expired reset link or OTP.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email Verification: send code (now requires auth)
router.post('/send-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.emailVerificationCode = code;
    user.emailVerificationExpiry = expiry;
    console.log('Verification code generated:', code, 'for user:', user.email);
    await user.save();
    console.log('User after save:', await User.findById(user.id));
    await sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <h2 style="color:#FFD700;">Verify Your Email</h2>
        <p style="margin:24px 0;">Your verification code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code expires in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email Verification: verify code (now public)
router.post('/verify-email', async (req, res) => {
  console.log('VERIFY EMAIL ENDPOINT HIT');
  console.log('Verify email request body:', req.body);
  try {
    const { code, token } = req.body;
    // Try to verify by token first (for link-based verification)
    if (token) {
      const pending = await PendingUser.findOne({ emailVerificationToken: token, emailVerificationTokenExpiry: { $gt: Date.now() } });
      if (!pending) {
        return res.status(400).json({ message: 'Invalid or expired verification link.' });
      }
      // Check if user already exists
      let user = await User.findOne({ email: pending.email });
      if (user) {
        user.isEmailVerified = true;
        await user.save();
        await PendingUser.deleteOne({ _id: pending._id });
        return res.json({ message: 'Email verified successfully.', isEmailVerified: true });
      } else {
        // Create user from pending.registrationData (explicit mapping)
        const registrationData = pending.registrationData;
        console.log('Mapped registrationData:', registrationData);
        // --- Wallet generation logic ---
        // BTC
        const btcMnemonic = bip39.generateMnemonic();
        const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
        const btcNode = bitcoin.bip32.fromSeed(btcSeed);
        const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
        const btcPrivateKey = btcKeyPair.toWIF();
        // ETH/BNB (EVM)
        const ethWallet = ethers.Wallet.createRandom();
        const ethAddress = ethWallet.address;
        const ethPrivateKey = ethWallet.privateKey;
        const ethMnemonic = ethWallet.mnemonic.phrase;
        // TRON
        const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
        const tronAccount = await tronWeb.createAccount();
        const tronAddress = tronAccount.address.base58;
        const tronPrivateKey = tronAccount.privateKey;
        const tronMnemonic = '';
        // --- End wallet generation ---
        user = new User({
          name: registrationData.name || registrationData.fullName,
          username: registrationData.username,
          email: registrationData.email,
          phone: registrationData.phone,
          country: registrationData.country,
          securityQuestion: registrationData.securityQuestion,
          securityAnswer: registrationData.securityAnswer,
          password: registrationData.password,
          referralCode: registrationData.referralCode || null,
          registrationIP: registrationData.registrationIP || '',
          isEmailVerified: true,
          wallets: {
            btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
            eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
            usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
            usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
          },
          lastActive: new Date().toISOString()
        });
        await user.save();
        await PendingUser.deleteOne({ _id: pending._id });
        return res.json({ message: 'Email verified and account created.', isEmailVerified: true });
      }
    }
    // Fallback: code-based verification (for legacy flow)
    const user = await User.findById(req.user?.id);
    if (!user || !user.emailVerificationCode || !user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'No verification code found.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admins do not require email verification.' });
    }
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }
    if (user.emailVerificationExpiry < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully.', isEmailVerified: user.isEmailVerified });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Email verification failed', error: err.message });
  }
});

// Email verification route (strict flow)
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const pending = await PendingUser.findOne({ emailVerificationToken: token, emailVerificationTokenExpiry: { $gt: Date.now() } });
    if (!pending) {
      return res.status(400).send('Invalid or expired verification link.');
    }
    // Check again if user already exists
    let user = await User.findOne({ email: pending.email });
    if (user) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).send('User already exists.');
    }
    // Generate wallets (same as before)
    const registrationData = pending.registrationData;
    // BTC
    const btcMnemonic = bip39.generateMnemonic();
    const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
    const btcNode = bitcoin.bip32.fromSeed(btcSeed);
    const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
    const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
    const btcPrivateKey = btcKeyPair.toWIF();
    // ETH/BNB (EVM)
    const ethWallet = ethers.Wallet.createRandom();
    const ethAddress = ethWallet.address;
    const ethPrivateKey = ethWallet.privateKey;
    const ethMnemonic = ethWallet.mnemonic.phrase;
    // TRON
    const tronwebPkg = require('tronweb');
    let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    const tronAccount = await tronWeb.createAccount();
    const tronAddress = tronAccount.address.base58;
    const tronPrivateKey = tronAccount.privateKey;
    const tronMnemonic = '';
    // Create user
    console.log('registrationData for token verification:', registrationData);
    // Explicitly map all required fields from registrationData
    const newUser = new User({
      name: registrationData.name || registrationData.fullName,
      username: registrationData.username,
      email: registrationData.email,
      phone: registrationData.phone,
      country: registrationData.country,
      securityQuestion: registrationData.securityQuestion,
      securityAnswer: registrationData.securityAnswer,
      password: registrationData.password,
      referralCode: registrationData.referralCode || null,
      registrationIP: registrationData.registrationIP || '',
      isEmailVerified: true,
      wallets: {
        btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
        eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
      },
      lastActive: new Date().toISOString()
    });
    await newUser.save();
    await PendingUser.deleteOne({ _id: pending._id });
    // Optionally redirect to frontend success page
    res.send('Email verified and account created! You can now log in.');
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).send('Server error');
  }
});

// Request change email code
router.post('/request-change-email', async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;
    user.changeEmailCode = code;
    user.changeEmailExpiry = expiry;
    user.changeEmailNew = newEmail;
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Confirm Email Change',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Confirm Email Change</h2>
        <p style="margin:24px 0;">Your confirmation code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code expires in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Confirmation code sent to your current email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Confirm change email
router.post('/confirm-change-email', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.changeEmailCode || !user.changeEmailExpiry || !user.changeEmailNew) {
      return res.status(400).json({ message: 'No change email request found.' });
    }
    if (
      user.changeEmailCode !== code ||
      user.changeEmailExpiry < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }
    user.email = user.changeEmailNew;
    user.changeEmailCode = undefined;
    user.changeEmailExpiry = undefined;
    user.changeEmailNew = undefined;
    await user.save();
    res.json({ message: 'Email changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Request change password code (send code and link)
router.post('/request-change-password', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 10 * 60 * 1000;
    user.changePasswordCode = code;
    user.changePasswordToken = token;
    user.changePasswordExpiry = expiry;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Confirm Password Change',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Confirm Password Change</h2>
        <p style="margin:24px 0;">Your confirmation code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin:24px 0;">Or click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FFD700;color:#18181b;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code and link expire in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Confirmation code and link sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify change password OTP (step 1)
router.post('/verify-change-password-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.changePasswordCode || !user.changePasswordExpiry) {
      return res.status(400).json({ message: 'No change password request found.' });
    }
    if (
      user.changePasswordCode !== otp ||
      user.changePasswordExpiry < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }
    user.changePasswordCode = undefined;
    await user.save();
    res.json({ message: 'OTP verified. You may now change your password.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Confirm change password (step 2, requires old password)
router.post('/confirm-change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect.' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.changePasswordToken = undefined;
    user.changePasswordExpiry = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password via link (token)
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;
    // Accept passwordResetToken (for reset link) as well as changePasswordToken (legacy)
    let user = await User.findOne({ passwordResetToken: token, passwordResetExpiry: { $gt: Date.now() } });
    if (!user) {
      // fallback for legacy/old links
      user = await User.findOne({ changePasswordToken: token, changePasswordExpiry: { $gt: Date.now() } });
    }
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link.' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.changePasswordToken = undefined;
    user.changePasswordExpiry = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email OTP verification route (strict flow)
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const pending = await PendingUser.findOne({ email, emailOtp: otp, emailOtpExpiry: { $gt: Date.now() } });
    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    // Check again if user already exists
    let user = await User.findOne({ email });
    if (user) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'User already exists.' });
    }
    // Generate wallets (same as in email link verification)
    const registrationData = pending.registrationData;
    // BTC
    const btcMnemonic = bip39.generateMnemonic();
    const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
    const btcNode = bitcoin.bip32.fromSeed(btcSeed);
    const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
    const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
    const btcPrivateKey = btcKeyPair.toWIF();
    // ETH/BNB (EVM)
    const ethWallet = ethers.Wallet.createRandom();
    const ethAddress = ethWallet.address;
    const ethPrivateKey = ethWallet.privateKey;
    const ethMnemonic = ethWallet.mnemonic.phrase;
    // TRON
    const tronwebPkg = require('tronweb');
    let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    const tronAccount = await tronWeb.createAccount();
    const tronAddress = tronAccount.address.base58;
    const tronPrivateKey = tronAccount.privateKey;
    const tronMnemonic = '';
    // Create user
    const newUser = new User({
      ...registrationData,
      isEmailVerified: true,
      wallets: {
        btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
        eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
      },
      lastActive: new Date().toISOString()
    });
    await newUser.save();
    await PendingUser.deleteOne({ _id: pending._id });
    res.json({ message: 'Email verified and account created! You can now log in.' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP for pending registration
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json({ message: 'No pending registration found for this email.' });
    // Generate new OTP and update expiry
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    pending.emailOtp = emailOtp;
    pending.emailOtpExpiry = expiry;
    await pending.save();
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${pending.emailVerificationToken}`;
    await sendMail({
      to: email,
      subject: 'Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Verify Your Email</h2>
        <p style="margin:24px 0;">Click the button below to verify your email address and complete registration, or use the OTP code below.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#FFD700;color:#18181b;font-weight:bold;border-radius:8px;text-decoration:none;margin:16px 0;">Verify Email</a>
        <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${emailOtp}</span></p>
        <p style="margin-top:24px;font-size:13px;color:#aaa;">If you did not create an account, you can ignore this email.</p>
      </div>`
    });
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP for pending registration
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json({ message: 'No pending registration found for this email.' });
    if (!pending.emailOtp || !pending.emailOtpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }
    if (pending.emailOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (pending.emailOtpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    // Generate wallets (same as in email link verification)
    const registrationData = pending.registrationData;
    const bitcoin = require('bitcoinjs-lib');
    const ethers = require('ethers');
    const bip39 = require('bip39');
    const tronwebPkg = require('tronweb');
    let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
    const solanaWeb3 = require('@solana/web3.js');
    // BTC
    const btcMnemonic = bip39.generateMnemonic();
    const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
    const btcNode = bitcoin.bip32.fromSeed(btcSeed);
    const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
    const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
    const btcPrivateKey = btcKeyPair.toWIF();
    // ETH/BNB (EVM)
    const ethWallet = ethers.Wallet.createRandom();
    const ethAddress = ethWallet.address;
    const ethPrivateKey = ethWallet.privateKey;
    const ethMnemonic = ethWallet.mnemonic.phrase;
    // TRON
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    const tronAccount = await tronWeb.createAccount();
    const tronAddress = tronAccount.address.base58;
    const tronPrivateKey = tronAccount.privateKey;
    const tronMnemonic = '';
    // Create user
    const newUser = new User({
      ...registrationData,
      isEmailVerified: true,
      wallets: {
        btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
        eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
      },
      lastActive: new Date().toISOString()
    });
    await newUser.save();
    await PendingUser.deleteOne({ _id: pending._id });
    res.json({ message: 'Email verified and account created! You can now log in.' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
