import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleGuestDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
    } catch {
      setError('Failed to enter demo mode.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password should be at least 6 characters.');
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name.trim(), email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Password reset email sent. Check your inbox.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code || ''));
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code || ''));
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">Habit Tracker</div>
          <div className="auth-tagline">
            {mode === 'login' && 'Track your habits. Build consistency.'}
            {mode === 'register' && 'Create your account to get started.'}
            {mode === 'forgot' && 'Reset your password.'}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {mode !== 'forgot' && (
          <>
            <button
              className="guest-btn"
              onClick={handleGuestDemo}
              disabled={loading}
              type="button"
              style={{
                width: '100%',
                padding: '9px 14px',
                background: '#5F5B54',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Sparkles size={16} />
              Instant Demo Preview (No Sign-in Needed)
            </button>

            <button
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              aria-label="Continue with Google"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider">or email</div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="form-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <div className="form-input-wrapper">
                <input
                  id="auth-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="form-input-wrapper">
                <input
                  id="auth-confirm-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Create Account' :
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <span className="auth-link" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}>
                Forgot password?
              </span>
              <span className="auth-link" onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>
                Create account
              </span>
            </>
          )}
          {mode === 'register' && (
            <>
              <span></span>
              <span className="auth-link" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Already have an account? Sign in
              </span>
            </>
          )}
          {mode === 'forgot' && (
            <>
              <span></span>
              <span className="auth-link" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Back to sign in
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
