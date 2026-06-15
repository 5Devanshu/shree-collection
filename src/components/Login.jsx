import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  identifyAccount,
  customerRequestOtp, customerVerifyOtp, customerRegister,
  resellerLogin, resellerRegister, resellerRequestOtp, resellerVerifyOtp,
} from '../api/client';
import './CustomerAuth.css';

// Steps:
// email → signin-choice (existing account)
//       → customer-otp (OTP verify)
//       → reseller-password (password login)
//       → reseller-otp (OTP verify for reseller)
//       → register-choice (no account)
//       → register-customer → customer-otp
//       → register-reseller → reseller-pending

const Login = () => {
  const navigate = useNavigate();
  const { loginCustomer } = useStore();

  const [step,     setStep]     = useState('email');
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState(''); // 'customer' | 'reseller'
  const [reg,      setReg]      = useState({ name: '', phone: '', company: '', password: '' });
  const [error,    setError]    = useState('');
  const [info,     setInfo]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const run = async (fn) => {
    setError(''); setInfo(''); setLoading(true);
    try { await fn(); }
    catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const backToEmail = () => {
    setStep('email'); setOtp(''); setPassword('');
    setError(''); setInfo(''); setAccountType('');
  };

  // ── Step 1: identify ────────────────────────────────────────────────────────
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await identifyAccount(email.trim().toLowerCase());
      const { type, status } = res.data;

      if (type === 'reseller') {
        if (status === 'pending') {
          setError('Your reseller account is awaiting admin verification. You\'ll receive an email once verified.');
          return;
        }
        if (status === 'rejected') {
          setError('Your reseller application was not approved. Please contact us for details.');
          return;
        }
        setAccountType('reseller');
        setStep('signin-choice');
      } else if (type === 'customer') {
        setAccountType('customer');
        setStep('signin-choice');
      } else {
        setStep('register-choice');
      }
    });
  };

  // ── Step 2: sign-in choice — send OTP ───────────────────────────────────────
  const handleSendOtp = () => {
    run(async () => {
      if (accountType === 'customer') {
        await customerRequestOtp(email.trim().toLowerCase());
      } else {
        await resellerRequestOtp(email.trim().toLowerCase());
      }
      setInfo(`We've sent a 6-digit code to ${email}.`);
      setOtp('');
      setStep('otp-verify');
    });
  };

  // ── Step 2: sign-in choice — password (reseller only) ───────────────────────
  const handleResellerPasswordSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await resellerLogin({ email: email.trim().toLowerCase(), password });
      localStorage.setItem('resellerToken', res.data.token);
      localStorage.setItem('resellerUser',  JSON.stringify(res.data.reseller));
      window.location.href = '/';
    });
  };

  // ── OTP verify — works for both customer and reseller ───────────────────────
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      if (accountType === 'customer') {
        const res = await customerVerifyOtp(email.trim().toLowerCase(), otp.trim());
        loginCustomer(res.data.token, res.data.customer);
        navigate('/');
      } else {
        const res = await resellerVerifyOtp(email.trim().toLowerCase(), otp.trim());
        localStorage.setItem('resellerToken', res.data.token);
        localStorage.setItem('resellerUser',  JSON.stringify(res.data.reseller));
        window.location.href = '/';
      }
    });
  };

  const handleResendOtp = () =>
    run(async () => {
      if (accountType === 'customer') {
        await customerRequestOtp(email.trim().toLowerCase());
      } else {
        await resellerRequestOtp(email.trim().toLowerCase());
      }
      setInfo('A new code has been sent.');
    });

  // ── New customer registration ────────────────────────────────────────────────
  const handleCustomerRegister = (e) => {
    e.preventDefault();
    run(async () => {
      await customerRegister({ name: reg.name, email: email.trim().toLowerCase(), phone: reg.phone });
      setAccountType('customer');
      setInfo(`Account created — we've sent a 6-digit code to ${email}.`);
      setOtp('');
      setStep('otp-verify');
    });
  };

  // ── New reseller application ─────────────────────────────────────────────────
  const handleResellerRegister = (e) => {
    e.preventDefault();
    run(async () => {
      await resellerRegister({
        name: reg.name, email: email.trim().toLowerCase(),
        phone: reg.phone, company: reg.company, password: reg.password,
      });
      setStep('reseller-pending');
    });
  };

  const handleRegChange = (e) => setReg(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── email ─────────────────────────────────────────────────────────── */}
        {step === 'email' && (
          <>
            <h1 className="display-sm">Login</h1>
            <p className="body-md auth-subtitle">Enter your email to sign in or create an account.</p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleEmailSubmit}>
              <input className="auth-input" type="email" placeholder="Email Address"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {/* ── signin-choice ─────────────────────────────────────────────────── */}
        {step === 'signin-choice' && (
          <>
            <h1 className="display-sm">Sign In</h1>
            <p className="body-md auth-subtitle">{email}</p>
            {error && <p className="auth-error">{error}</p>}
            {info  && <p className="auth-info">{info}</p>}
            <div className="auth-form">

              {/* Password — reseller only */}
              {accountType === 'reseller' && (
                <form onSubmit={handleResellerPasswordSubmit} style={{ width: '100%' }}>
                  <input className="auth-input" type="password" placeholder="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoFocus style={{ marginBottom: '12px' }} />
                  <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                    {loading ? 'Signing In…' : 'Sign In with Password'}
                  </button>
                </form>
              )}

              {/* Divider */}
              {accountType === 'reseller' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0', width: '100%' }}>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--outline)' }} />
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>or</span>
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--outline)' }} />
                </div>
              )}

              {/* OTP — both customer and reseller */}
              <button className="btn-primary auth-submit-btn"
                style={accountType === 'reseller' ? {
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                } : {}}
                onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP to Email'}
              </button>

            </div>
            <p className="auth-footer">
              <button type="button" onClick={backToEmail}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                Change email
              </button>
            </p>
          </>
        )}

        {/* ── otp-verify (customer + reseller shared) ───────────────────────── */}
        {step === 'otp-verify' && (
          <>
            <h1 className="display-sm">Enter Code</h1>
            <p className="body-md auth-subtitle">{info || `We've sent a 6-digit code to ${email}.`}</p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleOtpSubmit}>
              <input className="auth-input" type="text" inputMode="numeric" maxLength={6}
                placeholder="6-digit code" value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required autoFocus
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem' }} />
              <button className="btn-primary auth-submit-btn" type="submit"
                disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
            </form>
            <p className="auth-footer">
              <button type="button" onClick={handleResendOtp} disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                Resend code
              </button>
              {' · '}
              <button type="button" onClick={() => setStep('signin-choice')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                Back
              </button>
            </p>
          </>
        )}

        {/* ── register-choice ───────────────────────────────────────────────── */}
        {step === 'register-choice' && (
          <>
            <h1 className="display-sm">Create Account</h1>
            <p className="body-md auth-subtitle">No account found for {email}. How would you like to join?</p>
            {error && <p className="auth-error">{error}</p>}
            <div className="auth-form">
              <button className="btn-primary auth-submit-btn" onClick={() => setStep('register-customer')}>
                Shop as a Customer
              </button>
              <button className="btn-primary auth-submit-btn"
                style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                onClick={() => setStep('register-reseller')}>
                Apply as a Reseller
              </button>
            </div>
            <p className="auth-footer">
              <button type="button" onClick={backToEmail}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                Change email
              </button>
            </p>
          </>
        )}

        {/* ── register-customer ─────────────────────────────────────────────── */}
        {step === 'register-customer' && (
          <>
            <h1 className="display-sm">Customer Account</h1>
            <p className="body-md auth-subtitle">Quick signup — we'll email you a login code.</p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleCustomerRegister}>
              <input className="auth-input" type="email" value={email} disabled />
              <input className="auth-input" type="text" name="name" placeholder="Full Name"
                value={reg.name} onChange={handleRegChange} required autoFocus />
              <input className="auth-input" type="tel" name="phone" placeholder="Phone Number"
                value={reg.phone} onChange={handleRegChange} />
              <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          </>
        )}

        {/* ── register-reseller ─────────────────────────────────────────────── */}
        {step === 'register-reseller' && (
          <>
            <h1 className="display-sm">Reseller Application</h1>
            <p className="body-md auth-subtitle">
              Applications are reviewed by our team. You'll receive an email once verified.
            </p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleResellerRegister}>
              <input className="auth-input" type="email" value={email} disabled />
              <input className="auth-input" type="text" name="name" placeholder="Full Name"
                value={reg.name} onChange={handleRegChange} required autoFocus />
              <input className="auth-input" type="tel" name="phone" placeholder="Phone Number"
                value={reg.phone} onChange={handleRegChange} required />
              <input className="auth-input" type="text" name="company" placeholder="Business / Company Name"
                value={reg.company} onChange={handleRegChange} required />
              <input className="auth-input" type="password" name="password" placeholder="Choose a Password"
                value={reg.password} onChange={handleRegChange} required minLength={6} />
              <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>
            </form>
          </>
        )}

        {/* ── reseller-pending ──────────────────────────────────────────────── */}
        {step === 'reseller-pending' && (
          <>
            <h1 className="display-sm">Application Received ✓</h1>
            <p className="body-md auth-subtitle">
              Thank you! Our team will review your details. You'll get an email at <strong>{email}</strong> once
              your reseller account is verified.
            </p>
            <button className="btn-primary auth-submit-btn" onClick={() => navigate('/')}>
              Back to Store
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;