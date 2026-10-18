// ============================================
// LoginPage - Landing-Page Style Auth
// ============================================

import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import {
  register,
  emailLogin,
  forgotPassword,
  resetPassword,
} from '../../services/authService.js';
import {
  BsCameraVideo,
  BsMicFill,
  BsFileEarmarkTextFill,
  BsCodeSlash,
  BsBarChartFill,
  BsShieldCheck,
  BsPeopleFill,
  BsGithub,
  BsKeyFill,
  BsArrowLeft,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter code & new password

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCodeHint, setGeneratedCodeHint] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Listen for OAuth token or error returned in URL query params
  useEffect(() => {
    const token = searchParams.get('token');
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');
    const oauthError = searchParams.get('oauth_error');

    if (token) {
      const user = {
        name: nameParam || 'User',
        email: emailParam || '',
      };
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/', { replace: true });
    } else if (oauthError) {
      toast.error(decodeURIComponent(oauthError), { duration: 6000 });
    }
  }, [searchParams, login, navigate]);

  const handleSocialLogin = (provider) => {
    const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
    let baseUrl;
    try {
      const parsed = new URL(rawApiUrl);
      baseUrl = parsed.origin;
    } catch {
      baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
    }
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  // Handle standard login/register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await register(name, email, password);
        toast.success('Account created successfully!');
      } else {
        result = await emailLogin(email, password);
        toast.success('Welcome back!');
      }

      login(result.token, result.user);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password request
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setGeneratedCodeHint(res.resetCode);
      setResetCode(res.resetCode);
      setForgotStep(2);
      toast.success('Reset code generated! Check below or your inbox.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request reset code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset submission
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      toast.error('Please enter the reset code and a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email, resetCode, newPassword);
      toast.success('Password reset successfully! Logging you in...');
      login(result.token, result.user);
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ---- Top Nav Bar ---- */}
      <nav className="login-nav">
        <div className="login-nav-brand">
          <BsCameraVideo className="login-nav-icon" />
          <span className="login-nav-name">AI Mock Interview</span>
        </div>
      </nav>

      {/* ---- Hero Banner ---- */}
      <section className="login-hero">
        <h1 className="login-hero-heading">
          Practice Technical Interviews with{' '}
          <span className="login-hero-accent">AI Voice & Live Code</span>
        </h1>
        <p className="login-hero-tagline">
          Realistic questions, speech-to-speech dialogue, live code execution,
          and rubric-based performance scoring tailored to your resume.
        </p>

        {/* Feature Pills */}
        <div className="login-hero-features">
          <div className="login-hero-pill">
            <BsMicFill className="login-pill-icon" />
            <span className="login-pill-text">Voice Interviewer</span>
          </div>
          <div className="login-hero-pill">
            <BsCodeSlash className="login-pill-icon" />
            <span className="login-pill-text">In-Browser Code Editor</span>
          </div>
          <div className="login-hero-pill">
            <BsFileEarmarkTextFill className="login-pill-icon" />
            <span className="login-pill-text">Resume-Tailored Questions</span>
          </div>
          <div className="login-hero-pill">
            <BsBarChartFill className="login-pill-icon" />
            <span className="login-pill-text">Category Score Breakdown</span>
          </div>
        </div>
      </section>

      {/* ---- Form Card ---- */}
      <div className="login-form-wrapper">
        <div className="login-card">
          {isForgotPassword ? (
            /* Forgot Password Flow */
            <div className="forgot-password-panel">
              <div className="forgot-header">
                <button
                  type="button"
                  className="forgot-back-btn"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotStep(1);
                    setGeneratedCodeHint('');
                  }}
                >
                  <BsArrowLeft /> Back to Login
                </button>
                <h2 className="forgot-title">Reset Your Password</h2>
                <p className="forgot-subtitle">
                  {forgotStep === 1
                    ? 'Enter your registered email address to receive your 6-digit backup code.'
                    : 'Enter the 6-digit code and choose a new password.'}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestResetCode} className="login-form">
                  <div className="login-field">
                    <label htmlFor="forgot-email" className="login-label">
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="login-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`login-submit ${loading ? 'login-submit-disabled' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Generating Code...' : 'Send Reset Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="login-form">
                  {generatedCodeHint && (
                    <div className="reset-code-hint-box">
                      <BsKeyFill className="key-icon" />
                      <div>
                        <span>Your 6-Digit Backup Code:</span>
                        <strong>{generatedCodeHint}</strong>
                        <small>(Valid for 15 minutes)</small>
                      </div>
                    </div>
                  )}

                  <div className="login-field">
                    <label htmlFor="reset-code" className="login-label">
                      6-Digit Reset Code
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      className="login-input"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>

                  <div className="login-field">
                    <label htmlFor="new-password" className="login-label">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className="login-input"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`login-submit ${loading ? 'login-submit-disabled' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="login-tabs">
                <button
                  type="button"
                  className={`login-tab ${!isSignUp ? 'login-tab-active' : ''}`}
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`login-tab ${isSignUp ? 'login-tab-active' : ''}`}
                  onClick={() => setIsSignUp(true)}
                >
                  Create Account
                </button>
              </div>

              {/* Social Login Buttons */}
              <div className="login-social-buttons">
                <button
                  type="button"
                  className="social-auth-btn social-google-btn"
                  onClick={() => handleSocialLogin('google')}
                >
                  <svg className="social-btn-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  className="social-auth-btn social-github-btn"
                  onClick={() => handleSocialLogin('github')}
                >
                  <BsGithub className="social-btn-icon" />
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">
                  or {isSignUp ? 'sign up' : 'sign in'} with email
                </span>
                <span className="login-divider-line" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="login-form">
                {isSignUp && (
                  <div className="login-field">
                    <label htmlFor="name" className="login-label">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      className="login-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="login-field">
                  <label htmlFor="email" className="login-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="login-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="login-field">
                  <div className="login-password-header">
                    <label htmlFor="password" className="login-label">Password</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotStep(1);
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    id="password"
                    type="password"
                    className="login-input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className={`login-submit ${loading ? 'login-submit-disabled' : ''}`}
                  disabled={loading}
                >
                  {loading
                    ? 'Please wait...'
                    : isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Trust Indicators Below Card */}
        <div className="login-trust">
          <div className="login-trust-item">
            <BsShieldCheck className="login-trust-icon" />
            <span className="login-trust-text">Secure & Private</span>
          </div>
          <div className="login-trust-item">
            <BsPeopleFill className="login-trust-icon" />
            <span className="login-trust-text">Join 10,000+ users</span>
          </div>
          <div className="login-trust-item">
            <BsBarChartFill className="login-trust-icon" />
            <span className="login-trust-text">Continuous Level Comparison</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
