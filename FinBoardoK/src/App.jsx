import { useState, useEffect } from 'react';
import { auth } from './utils/firebase.js';
import Auth from './components/Auth.jsx';
import Navbar from './components/Navbar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Budgets from './components/BudgetCard.jsx';
import History from './components/History.jsx';
import Groups from './components/Groups.jsx';
import Settings from './components/Settings.jsx';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'budgets':
        return <Budgets />;
      case 'history':
        return <History />;
      case 'groups':
        return <Groups />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        userName={user.email?.split('@')[0]}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;