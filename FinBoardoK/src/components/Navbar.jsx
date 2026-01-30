import { useState } from 'react';
import { logout } from '../utils/data';

function Navbar({ currentPage, setCurrentPage, userName }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      window.location.reload();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-logo">FinTrack</h1>

        <div className="navbar-links">
          <button 
            className={currentPage === 'dashboard' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={currentPage === 'budgets' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('budgets')}
          >
            💰 Budgets
          </button>
          <button 
            className={currentPage === 'history' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('history')}
          >
            📜 Historique
          </button>
          <button 
            className={currentPage === 'groups' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('groups')}
          >
            👥 Groupes
          </button>
        </div>

        <div className="navbar-user">
          <button className="user-menu" onClick={() => setShowMenu(!showMenu)}>
            <span className="user-avatar">👤</span>
            <span className="user-name">{userName || 'Utilisateur'}</span>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={() => {
                setCurrentPage('settings');
                setShowMenu(false);
              }}>
                ⚙️ Paramètres
              </button>
              <button onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* Menu mobile */}
        <button className="mobile-menu-btn" onClick={() => setShowMenu(!showMenu)}>
          ☰
        </button>
      </div>

      {showMenu && (
        <div className="mobile-menu">
          <button onClick={() => { setCurrentPage('dashboard'); setShowMenu(false); }}>
            📊 Dashboard
          </button>
          <button onClick={() => { setCurrentPage('budgets'); setShowMenu(false); }}>
            💰 Budgets
          </button>
          <button onClick={() => { setCurrentPage('history'); setShowMenu(false); }}>
            📜 Historique
          </button>
          <button onClick={() => { setCurrentPage('groups'); setShowMenu(false); }}>
            👥 Groupes
          </button>
          <button onClick={() => { setCurrentPage('settings'); setShowMenu(false); }}>
            ⚙️ Paramètres
          </button>
          <button onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;