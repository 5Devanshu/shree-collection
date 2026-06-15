import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  identifyAccount,
  customerLoginPassword, customerRequestOtp, customerVerifyOtp, customerRegister,
  resellerLogin, resellerRegister, resellerRequestOtp, resellerVerifyOtp,
} from '../api/client';
import './CustomerAuth.css';

const Login = () => {
  const navigate = useNavigate();
  const { loginCustomer } = useStore();

  const [step,        setStep]        = useState('identifier');
  const [identifier,  setIdentifier]  = useState('');  // email | phone | username
  const [otp,         setOtp]         = useState('');
  const [password,    setPassword]    = useState('');
  const [accountType, setAccountType] = useState('');  // 'customer' | 'reseller' | 'none'
  const [hasEmail,    setHasEmail]    = useState(false); // whether resolved account has email
  const [reg,         setReg]         = useState({
    name: '', email: '', phone: '', username: '', password: '', company: '',
    address: { line1: '', line2: '', city: '', state: '', pincode: '' },
  });
  const [error,   setError]   = useState('');
  const [info,    setInfo]    = useState('');
  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setError(''); setInfo(''); setLoading(true);
    try { await fn(); }
    catch (err) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const back = (toStep) => {
    setStep(toStep); setOtp(''); setPassword(''); setError(''); setInfo('');
  };

  // ── Step 1: identify ────────────────────────────────────────────────────────
  const handleIdentifierSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const val = identifier.trim();
      const res = await identifyAccount(val);
      const { type, status, hasEmail: accountHasEmail } = res.data;

      if (type === 'reseller') {
        if (status === 'pending')  { setError('Your account is awaiting admin verification.'); return; }
        if (status === 'rejected') { setError('Your application was not approved. Contact us.'); return; }
        setAccountType('reseller');
        setHasEmail(!!accountHasEmail);
        setStep('signin-choice');
      } else if (type === 'customer') {
        setAccountType('customer');
        setHasEmail(!!accountHasEmail);
        setStep('signin-choice');
      } else {
        setStep('register-choice');
      }
    });
  };

  // ── Sign in with password ───────────────────────────────────────────────────
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      if (accountType === 'customer') {
        const res = await customerLoginPassword({ identifier: identifier.trim(), password });
        loginCustomer(res.data.token, res.data.customer);
        navigate('/');
      } else {
        const res = await resellerLogin({ identifier: identifier.trim(), password });
        localStorage.setItem('resellerToken', res.data.token);
        localStorage.setItem('resellerUser',  JSON.stringify(res.data.reseller));
        window.location.href = '/';
      }
    });
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = () => {
    run(async () => {
      if (accountType === 'customer') {
        await customerRequestOtp(identifier.trim());
      } else {
        await resellerRequestOtp(identifier.trim());
      }
      setInfo('OTP sent to your email.');
      setOtp('');
      setStep('otp-verify');
    });
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      if (accountType === 'customer') {
        const res = await customerVerifyOtp(identifier.trim(), otp.trim());
        loginCustomer(res.data.token, res.data.customer);
        navigate('/');
      } else {
        const res = await resellerVerifyOtp(identifier.trim(), otp.trim());
        localStorage.setItem('resellerToken', res.data.token);
        localStorage.setItem('resellerUser',  JSON.stringify(res.data.reseller));
        window.location.href = '/';
      }
    });
  };

  const handleResendOtp = () =>
    run(async () => {
      accountType === 'customer'
        ? await customerRequestOtp(identifier.trim())
        : await resellerRequestOtp(identifier.trim());
      setInfo('A new code has been sent.');
    });

  // ── Register customer ───────────────────────────────────────────────────────
  const handleCustomerRegister = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await customerRegister({
        name:     reg.name,
        password: reg.password,
        email:    reg.email    || undefined,
        phone:    reg.phone    || undefined,
        username: reg.username || undefined,
        address:  reg.address,
      });
      loginCustomer(res.data.token, res.data.customer);
      navigate('/');
    });
  };

  // ── Register reseller ───────────────────────────────────────────────────────
  const handleResellerRegister = (e) => {
    e.preventDefault();
    run(async () => {
      await resellerRegister({
        name:     reg.name,
        password: reg.password,
        email:    reg.email    || undefined,
        phone:    reg.phone    || undefined,
        username: reg.username || undefined,
        company:  reg.company,
      });
      setStep('reseller-pending');
    });
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    if (name in reg.address) {
      setReg(p => ({ ...p, address: { ...p.address, [name]: value } }));
    } else {
      setReg(p => ({ ...p, [name]: value }));
    }
  };

  const identifierPlaceholder = 'Email, phone number, or username';

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── identifier ──────────────────────────────────────────────────── */}
        {step === 'identifier' && (
          <>
            <h1 className="display-sm">Sign In</h1>
            <p className="body-md auth-subtitle">Enter your email, phone, or username.</p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleIdentifierSubmit}>
              <input className="auth-input" type="text" placeholder={identifierPlaceholder}
                value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus />
              <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </form>
            <p className="auth-footer" style={{ textAlign: 'center', marginTop: '16px' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => setStep('register-choice')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>
                Create one
              </button>
            </p>
          </>
        )}

        {/* ── signin-choice ────────────────────────────────────────────────── */}
        {step === 'signin-choice' && (
          <>
            <h1 className="display-sm">Welcome Back</h1>
            <p className="body-md auth-subtitle" style={{ wordBreak: 'break-all' }}>{identifier}</p>
            {error && <p className="auth-error">{error}</p>}
            {info  && <p className="auth-info">{info}</p>}
            <div className="auth-form">
              <form onSubmit={handlePasswordSubmit} style={{ width: '100%' }}>
                <input className="auth-input" type="password" placeholder="Password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoFocus style={{ marginBottom: '12px' }} />
                <button className="btn-primary auth-submit-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing In…' : 'Sign In with Password'}
                </button>
              </form>

              {/* OTP only shown if account has email */}
              {hasEmail && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0', width: '100%' }}>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--outline)' }} />
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>or</span>
                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--outline)' }} />
                  </div>
                  <button className="btn-primary auth-submit-btn"
                    style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                    onClick={handleSendOtp} disabled={loading}>
                    {loading ? 'Sending…' : 'Send OTP to Email'}
                  </button>
                </>
              )}
            </div>
            <p className="auth-footer">
              <button type="button" onClick={() => back('identifier')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                ← Back
              </button>
            </p>
          </>
        )}

        {/* ── otp-verify ───────────────────────────────────────────────────── */}
        {step === 'otp-verify' && (
          <>
            <h1 className="display-sm">Enter Code</h1>
            <p className="body-md auth-subtitle">{info || 'Enter the 6-digit code sent to your email.'}</p>
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
              <button type="button" onClick={() => back('signin-choice')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                Back
              </button>
            </p>
          </>
        )}

        {/* ── register-choice ──────────────────────────────────────────────── */}
        {step === 'register-choice' && (
          <>
            <h1 className="display-sm">Create Account</h1>
            <p className="body-md auth-subtitle">How would you like to join?</p>
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
              <button type="button" onClick={() => back('identifier')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                ← Back
              </button>
            </p>
          </>
        )}

        {/* ── register-customer ─────────────────────────────────────────────── */}
        {step === 'register-customer' && (
          <>
            <h1 className="display-sm">Customer Account</h1>
            <p className="body-md auth-subtitle">Provide at least one of: email, phone, or username.</p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleCustomerRegister}>
              <input className="auth-input" type="text" name="name" placeholder="Full Name *"
                value={reg.name} onChange={handleRegChange} required autoFocus />
              <input className="auth-input" type="password" name="password" placeholder="Password *"
                value={reg.password} onChange={handleRegChange} required minLength={6} />
              <input className="auth-input" type="email" name="email" placeholder="Email (optional)"
                value={reg.email} onChange={handleRegChange} />
              <input className="auth-input" type="tel" name="phone" placeholder="Phone (optional)"
                value={reg.phone} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="username" placeholder="Username (optional)"
                value={reg.username} onChange={handleRegChange} />

              {/* Address */}
              <p className="body-sm" style={{ margin: '8px 0 4px', color: 'var(--on-surface-variant)' }}>
                Delivery Address (optional)
              </p>
              <input className="auth-input" type="text" name="line1" placeholder="Address Line 1"
                value={reg.address.line1} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="line2" placeholder="Address Line 2"
                value={reg.address.line2} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="city" placeholder="City"
                value={reg.address.city} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="state" placeholder="State"
                value={reg.address.state} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="pincode" placeholder="Pincode"
                value={reg.address.pincode} onChange={handleRegChange} />

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
              Applications are reviewed by our team. You'll be notified once verified.
            </p>
            {error && <p className="auth-error">{error}</p>}
            <form className="auth-form" onSubmit={handleResellerRegister}>
              <input className="auth-input" type="text" name="name" placeholder="Full Name *"
                value={reg.name} onChange={handleRegChange} required autoFocus />
              <input className="auth-input" type="password" name="password" placeholder="Password *"
                value={reg.password} onChange={handleRegChange} required minLength={6} />
              <input className="auth-input" type="text" name="company" placeholder="Business / Company Name *"
                value={reg.company} onChange={handleRegChange} required />
              <input className="auth-input" type="email" name="email" placeholder="Email (optional)"
                value={reg.email} onChange={handleRegChange} />
              <input className="auth-input" type="tel" name="phone" placeholder="Phone (optional)"
                value={reg.phone} onChange={handleRegChange} />
              <input className="auth-input" type="text" name="username" placeholder="Username (optional)"
                value={reg.username} onChange={handleRegChange} />
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
              Our team will review your details and notify you once your account is verified.
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