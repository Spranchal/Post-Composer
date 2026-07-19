import { useState } from 'react';
import { API_URL } from '../../config';

export default function Login({ onAuthSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Input focus scaling states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Decorative Blobs */}
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      {/* Navigation Header */}
      <header className="header-nav">
        <div className="brand-logo-container">
          <div className="brand-icon-wrapper">
            <span className="material-symbols-outlined">bubble_chart</span>
          </div>
          <span className="brand-title">Aura</span>
        </div>
        <button className="logout-icon-btn tap-active" title="Help">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      {/* Auth Content */}
      <main className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Experience the next generation of modern simplicity.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div className={`input-wrapper ${emailFocused ? 'focus-scale' : ''}`}>
              <input
                className="form-input"
                id="email"
                type="email"
                placeholder="hello@auraui.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className={`input-wrapper ${passwordFocused ? 'focus-scale' : ''}`}>
              <input
                className="form-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary tap-active"
            disabled={loading}
            style={{ marginTop: '12px' }}
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">or continue with</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-buttons-grid">
          <button className="btn-social tap-active" type="button">
            <svg viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Google
          </button>
          <button className="btn-social tap-active" type="button">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05 1.61-3.21 1.61-1.12 0-1.5-.68-2.84-.68-1.33 0-1.78.65-2.83.68-1.16 0-2.23-.66-3.21-1.61-2.01-2.01-3.53-5.69-3.53-9.15 0-3.41 1.77-5.21 3.44-5.21.89 0 1.73.54 2.27.54.54 0 1.48-.65 2.53-.65 1.1 0 2.45.54 3.25 1.57-2.64 1.54-2.2 5.17.45 6.25-.66 1.61-1.57 3.21-2.32 4.65zm-2.45-16.14c0 1.1-.9 2.53-2.19 2.53-1.29 0-2.44-1.43-2.44-2.53 0-1.1.9-2.53 2.19-2.53 1.29 0 2.44 1.43 2.44 2.53z"></path>
            </svg>
            Apple
          </button>
        </div>

        <footer className="auth-footer">
          Don't have an account?
          <button
            type="button"
            className="auth-footer-link"
            onClick={onSwitchToSignup}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign up
          </button>
        </footer>
      </main>
    </div>
  );
}
