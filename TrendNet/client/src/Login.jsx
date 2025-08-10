
import { useState, useEffect } from 'react';
import TrendNetLogo from '/TrendNet.png';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [notification, setNotification] = useState(null);

  // Sound effects
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore autoplay restrictions
    } catch (e) {
      // Fallback for browsers that don't support audio
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    playNotificationSound();
    setTimeout(() => setNotification(null), 4000);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    
    if (isRegistering) {
      if (!username.trim() || !email.trim() || !password.trim()) {
        return setErr('All fields are required');
      }
      if (password.length < 6) {
        return setErr('Password must be at least 6 characters');
      }
    } else {
      if (!username.trim()) return setErr('Enter a username');
    }

    setLoading(true);
    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const body = isRegistering 
        ? { username: username.trim(), email: email.trim(), password }
        : { username: username.trim() };

      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      showNotification(
        isRegistering 
          ? `Welcome to TrendNet, ${username}! Your account has been created.` 
          : `Welcome back, ${username}!`
      );
      
      onLogin(data); // { token, username, userId }
    } catch (e) {
      setErr(e.message);
      showNotification(e.message, 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const quickLogin = async (handle) => {
    if (!handle) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: handle }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showNotification(`Quick login as ${handle}!`);
      onLogin(data);
    } catch (e) {
      setErr(e.message);
      showNotification(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setErr(null);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notification-close">×</button>
        </div>
      )}

      <div className="auth-card">
        {/* Logo and Header */}
        <div className="auth-header">
          <img src={TrendNetLogo} alt="TrendNet" className="auth-logo" />
          <h1 className="auth-title">TrendNet</h1>
          <p className="auth-subtitle">
            {isRegistering ? 'Join the fashion conversation' : 'Welcome back to the community'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="form-input"
              disabled={loading}
            />
          </div>

          {isRegistering && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {err && <div className="error-message">{err}</div>}

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">Loading...</span>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="auth-toggle">
          <p>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              onClick={toggleMode}
              className="toggle-button"
              disabled={loading}
            >
              {isRegistering ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        {/* Quick Login Options */}
        {!isRegistering && (
          <div className="quick-login">
            <p className="quick-login-title">Quick Demo Login</p>
            <div className="quick-login-buttons">
              {['@Addison_Jane', '@Brooklyn_May', '@Glam_Gigi'].map(handle => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => quickLogin(handle)}
                  className="quick-login-button"
                  disabled={loading}
                >
                  {handle.replace('@', '')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="demo-notice">
          <p>This is a demo application with username-only authentication for testing purposes.</p>
        </div>
      </div>
    </div>
  );
}
