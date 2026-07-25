// src/pages/Register.js
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiShield, FiLock, FiCheckCircle } from 'react-icons/fi';
import countries from '../utils/countries';

// Defensive helper to render only strings
function SafeString({ value }) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return null;
}

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const referralFromUrl = searchParams.get('ref') || '';
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showReferral, setShowReferral] = useState(Boolean(referralFromUrl));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const AUTH_PATH = `${API_BASE_URL}/api/auth`;

  const formik = useFormik({
    initialValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      country: '',
      password: '',
      confirmPassword: '',
      referralCode: referralFromUrl,
      acceptedTerms: false,
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Required'),
      username: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email').required('Required'),
      phone: Yup.string().required('Required'),
      country: Yup.string().required('Required'),
      password: Yup.string()
        .required('Required')
        .min(8, 'Must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain an uppercase letter')
        .matches(/[a-z]/, 'Must contain a lowercase letter')
        .matches(/[0-9]/, 'Must contain a number')
        .matches(/[^A-Za-z0-9]/, 'Must contain a special character'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Required'),
      referralCode: Yup.string(),
      acceptedTerms: Yup.boolean().oneOf([true], 'You must accept the Terms of Service and Privacy Policy'),
    }),
    onSubmit: async (values) => {
      const registrationPayload = {
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phone: values.phone,
        country: values.country,
        password: values.password,
        referralCode: values.referralCode,
      };
      console.log('Registration data being sent:', registrationPayload);
      try {
        await axios.post(`${AUTH_PATH}/register`, registrationPayload);
        // Registration successful, show verification modal
        setRegisteredEmail(values.email);
        setShowVerifyModal(true);
      } catch (error) {
        console.error('Registration error:', error);
        if (error.response) {
          console.error('Backend response:', error.response.data);
          if (error.response.data && error.response.data.message === 'User already exists') {
            alert('An account with this email or username already exists. Please log in or use a different email.');
          } else {
            alert(error.response.data.message || 'Registration failed. Please try again.');
          }
        } else {
          alert('Registration failed. Please check your network connection.');
        }
      }
    },
  });

  const passwordValue = formik.values.password || '';
  const passwordRules = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
  };

  return (
    <React.Fragment>
      <div className="min-h-screen flex items-center justify-center bg-dark p-2 sm:p-4">
        <div className="glassmorphic p-4 sm:p-8 rounded-xl w-full max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] items-stretch">
            <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-gray-800 bg-gray-950 p-8">
              <div>
                <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                  Investor Signup
                </span>
                <h1 className="mt-6 text-3xl font-bold text-white">Grow your wealth with intelligent investing.</h1>
                <p className="mt-4 text-gray-400 leading-7">
                  Fast onboarding for new investors: create your account, verify your email, and complete your profile in a secure, trust-focused flow.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 rounded-3xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                    <FiShield size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Encrypted & secure</p>
                    <p className="text-sm text-gray-400">Your personal information is protected end to end.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-3xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                    <FiLock size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Email verification first</p>
                    <p className="text-sm text-gray-400">Verify your email before accessing the dashboard.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-3xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                    <FiCheckCircle size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Investor-ready experience</p>
                    <p className="text-sm text-gray-400">Only essential information now, optional details later.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-800 bg-gray-950 p-8">
              <div className="mb-6">
                <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Step 1 of 2</div>
                <h2 className="mt-3 text-3xl font-bold text-white">Create your account</h2>
                <p className="mt-2 text-gray-400">A simple signup with strong security and a trusted investment-first experience.</p>
              </div>
              <form onSubmit={formik.handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-fullName" className="block mb-2 text-sm font-medium text-gray-200">Full Name</label>
                    <input
                      id="register-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.fullName}
                      className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                    />
                    {formik.touched.fullName && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.fullName} /></div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-username" className="block mb-2 text-sm font-medium text-gray-200">Username</label>
                    <input
                      id="register-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.username}
                      className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                    />
                    {formik.touched.username && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.username} /></div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="register-email" className="block mb-2 text-sm font-medium text-gray-200">Email</label>
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.email}
                      className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                    />
                    {formik.touched.email && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.email} /></div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-country" className="block mb-2 text-sm font-medium text-gray-200">Country</label>
                    <select
                      id="register-country"
                      name="country"
                      autoComplete="country"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.country}
                      className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                    >
                      <option value="">Select country</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {formik.touched.country && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.country} /></div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-phone" className="block mb-2 text-sm font-medium text-gray-200">Phone</label>
                    <input
                      id="register-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.phone}
                      className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.phone} /></div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-gray-200">Password</label>
                    <div className="relative">
                      <input
                        id="register-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.password}
                        className="w-full bg-dark border border-gray-700 rounded-xl p-3 pr-12 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {formik.touched.password && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.password} /></div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="register-confirmPassword" className="block mb-2 text-sm font-medium text-gray-200">Confirm Password</label>
                    <div className="relative">
                      <input
                        id="register-confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.confirmPassword}
                        className="w-full bg-dark border border-gray-700 rounded-xl p-3 pr-12 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {formik.touched.confirmPassword && (
                      <div className="text-red-500 text-sm"><SafeString value={formik.errors.confirmPassword} /></div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setShowReferral(prev => !prev)}
                      className="text-left text-sm font-semibold text-gold hover:text-yellow-400"
                    >
                      {showReferral ? 'Hide referral code' : 'Have a referral code?'}
                    </button>
                    {showReferral && (
                      <div className="mt-3">
                        <label htmlFor="register-referralCode" className="block mb-2 text-sm font-medium text-gray-200">Referral Code</label>
                        <input
                          id="register-referralCode"
                          name="referralCode"
                          type="text"
                          autoComplete="off"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.referralCode}
                          className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 rounded-3xl border border-gray-800 bg-gray-900 p-4">
                  <div className="grid gap-2 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <span className={passwordRules.length ? 'text-green-400' : 'text-gray-500'}>•</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordRules.uppercase ? 'text-green-400' : 'text-gray-500'}>•</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordRules.lowercase ? 'text-green-400' : 'text-gray-500'}>•</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordRules.number ? 'text-green-400' : 'text-gray-500'}>•</span>
                      <span>One number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={passwordRules.special ? 'text-green-400' : 'text-gray-500'}>•</span>
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-3">
                  <label className="relative inline-flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="acceptedTerms"
                      checked={formik.values.acceptedTerms}
                      onChange={formik.handleChange}
                      className="peer sr-only"
                    />
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded border border-gray-700 bg-gray-900 peer-checked:bg-gold peer-checked:border-gold text-xs text-white">
                      {formik.values.acceptedTerms ? '✓' : ''}
                    </span>
                    <span className="text-sm text-gray-300">
                    I agree to the <a href="/legal#terms" className="text-gold hover:underline">Terms of Service</a> and <a href="/legal#privacy" className="text-gold hover:underline">Privacy Policy</a>.
                    </span>
                  </label>
                </div>
                {formik.touched.acceptedTerms && formik.errors.acceptedTerms && (
                  <div className="mt-2 text-red-500 text-sm"><SafeString value={formik.errors.acceptedTerms} /></div>
                )}
                <button
                  type="submit"
                  className="mt-6 w-full bg-gold text-black font-bold py-3 rounded-xl hover:bg-yellow-600 transition"
                >
                  Create My Account
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <a href="/login" className="text-gold hover:underline">Sign in</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-md relative text-center">
            <h2 className="text-xl font-bold mb-4 text-gold">Verify Your Email</h2>
            <p className="mb-4 text-white">
              A verification link and OTP have been sent to <span className="font-bold">{registeredEmail}</span>.<br/>
              Please check your inbox and follow the instructions to verify your email address.<br/>
              <span className="text-sm text-gray-400">(You can enter the OTP below if you prefer)</span>
            </p>
            <button
              className="mb-4 text-gold underline text-sm"
              type="button"
              disabled={isVerifying || otpSuccess}
              onClick={async () => {
                setOtpError("");
                try {
                  await axios.post(`${AUTH_PATH}/resend-otp`, { email: registeredEmail });
                  setOtpError("A new OTP has been sent to your email.");
                } catch (err) {
                  setOtpError(err.response?.data?.message || "Failed to resend OTP.");
                }
              }}
            >
              Resend OTP
            </button>
            {otpSuccess ? (
              <div className="mb-4 text-green-400 font-bold">Email verified! You can now log in.</div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsVerifying(true);
                  setOtpError("");
                  try {
                    await axios.post(`${AUTH_PATH}/verify-email-otp`, {
                      email: registeredEmail,
                      otp,
                    });
                    setOtpSuccess(true);
                    setTimeout(() => {
                      setShowVerifyModal(false);
                      navigate("/login");
                    }, 1500);
                  } catch (err) {
                    setOtpError(
                      err.response?.data?.message || "Verification failed. Please try again."
                    );
                  } finally {
                    setIsVerifying(false);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-dark border border-gray-700 rounded p-3 mb-2 text-center text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                  disabled={isVerifying || otpSuccess}
                />
                {otpError && <div className="text-red-400 mb-2">{otpError}</div>}
                <button
                  type="submit"
                  className="w-full bg-gold text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
                  disabled={isVerifying || otpSuccess}
                >
                  {isVerifying ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}
            <button
              className="mt-4 bg-gray-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
              onClick={() => navigate("/login")}
              disabled={isVerifying}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Register;
