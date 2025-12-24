import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function App() {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('komerciohub_auth');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem('komerciohub_auth', JSON.stringify(auth));
    } else {
      localStorage.removeItem('komerciohub_auth');
    }
  }, [auth]);

  const handleLogout = () => setAuth(null);

  if (!auth) {
    return <LoginPage onLogin={setAuth} />;
  }

  return <DashboardPage auth={auth} onLogout={handleLogout} />;
}

export default App;
