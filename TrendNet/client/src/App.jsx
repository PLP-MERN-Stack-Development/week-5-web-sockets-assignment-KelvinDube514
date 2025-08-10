import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login.jsx';
import Chat from './Chat.jsx';
import Profile from './Profile.jsx';

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem('trendnet_auth');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem('trendnet_auth', JSON.stringify(auth));
    else localStorage.removeItem('trendnet_auth');
  }, [auth]);

  const onLogin = (data) => {
    // data: { token, username, userId }
    if (data && data.token && data.username && data.userId) {
      setAuth({ token: data.token, username: data.username, userId: data.userId });
    }
  };

  const onLogout = () => setAuth(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={auth ? (
            <Chat token={auth.token} username={auth.username} userId={auth.userId} onLogout={onLogout} />
          ) : (
            <Login onLogin={onLogin} />
          )}
        />
        <Route path="/profile/:handle" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}