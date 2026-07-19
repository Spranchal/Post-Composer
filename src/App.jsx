import { useState, useEffect } from 'react';
import Signup from './pages/Auth/Signup';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import { API_URL } from './config';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('login');
  };

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Verify token error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--primary)',
        fontFamily: 'var(--font-family)',
        fontWeight: '600',
        fontSize: '18px'
      }}>
        Loading Aura...
      </div>
    );
  }

  if (token && user) {
    return (
      <Dashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
      />
    );
  }

  if (view === 'signup') {
    return (
      <Signup 
        onAuthSuccess={handleAuthSuccess} 
        onSwitchToLogin={() => setView('login')} 
      />
    );
  }

  return (
    <Login 
      onAuthSuccess={handleAuthSuccess} 
      onSwitchToSignup={() => setView('signup')} 
    />
  );
}
