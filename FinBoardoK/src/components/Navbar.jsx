import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logout, getPendingGroupNotificationsCount, getGroupNotificationsList } from '../utils/data';
import { 
  IconDashboard, 
  IconWallet, 
  IconHistory, 
  IconUsers, 
  IconSettings, 
  IconLogout, 
  IconUser, 
  IconMenu,
  IconCalendar,
  IconBell,
  IconX
} from './Icons';

function Navbar({ currentPage, setCurrentPage, userName }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState([]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const count = await getPendingGroupNotificationsCount();
    setNotifCount(count);
    const list = await getGroupNotificationsList();
    setNotifList(list);
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      window.location.reload();
    }
  };

  const rawDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const todayFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-brand" onClick={() => setCurrentPage('dashboard')}>
            <img src="/logo.png" alt="Heleanaf Logo" className="brand-logo-img" />
            <span className="brand-name">Heleanaf</span>
          </div>

          <div className="navbar-date">
            <IconCalendar size={15} />
            <span>{todayFormatted}</span>
          </div>
        </div>

        <div className="navbar-links">
          <button 
            className={currentPage === 'dashboard' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('dashboard')}
          >
            <IconDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={currentPage === 'budgets' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('budgets')}
          >
            <IconWallet size={18} />
            <span>Budgets</span>
          </button>
          <button 
            className={currentPage === 'history' ? 'nav-link active' : 'nav-link'}
            onClick={() => setCurrentPage('history')}
          >
            <IconHistory size={18} />
            <span>Historique</span>
          </button>
          <button 
            className={currentPage === 'groups' ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setCurrentPage('groups');
              fetchNotifications();
            }}
          >
            <IconUsers size={18} />
            <span>Groupes</span>
            {notifCount > 0 && (
              <span className="nav-badge" title={`${notifCount} demande(s) de retrait en attente de votre confirmation`}>
                {notifCount}
              </span>
            )}
          </button>
        </div>

        <div className="navbar-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Notification Bell Center */}
          <div className="notif-bell-wrapper" style={{ position: 'relative' }}>
            <button 
              className="notif-bell-btn"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowMenu(false);
              }}
              title="Centre de Notifications"
            >
              <IconBell size={20} />
              {notifCount > 0 && (
                <span className="notif-badge-count">{notifCount}</span>
              )}
            </button>

            {showNotifMenu && (
              <div className="notif-dropdown-menu">
                <div className="notif-dropdown-header">
                  <h4>Notifications ({notifCount})</h4>
                  <button className="btn-icon" onClick={() => setShowNotifMenu(false)}><IconX size={16} /></button>
                </div>

                <div className="notif-list-container">
                  {notifList.length === 0 ? (
                    <div className="notif-empty-state">
                      <p>Aucune nouvelle notification.</p>
                    </div>
                  ) : (
                    notifList.map(n => (
                      <div 
                        key={n.id} 
                        className="notif-item"
                        onClick={() => {
                          setCurrentPage('groups');
                          setShowNotifMenu(false);
                        }}
                      >
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-action">Cliquez pour consulter le groupe →</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="navbar-user">
            <button className="user-menu" onClick={() => { setShowMenu(!showMenu); setShowNotifMenu(false); }}>
              <div className="user-avatar">
                <IconUser size={18} />
              </div>
              <span className="user-name">{userName || 'Utilisateur'}</span>
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={() => {
                  setCurrentPage('settings');
                  setShowMenu(false);
                }}>
                  <IconSettings size={16} />
                  <span>Paramètres</span>
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  <IconLogout size={16} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu mobile button */}
        <button className="mobile-menu-btn" onClick={() => setShowMenu(!showMenu)}>
          <IconMenu size={24} />
          {notifCount > 0 && <span className="nav-badge-dot"></span>}
        </button>
      </div>

      {showMenu && (
        <div className="mobile-menu">
          <div className="mobile-date">
            <IconCalendar size={15} />
            <span>{todayFormatted}</span>
          </div>
          <button onClick={() => { setCurrentPage('dashboard'); setShowMenu(false); }}>
            <IconDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => { setCurrentPage('budgets'); setShowMenu(false); }}>
            <IconWallet size={18} />
            <span>Budgets</span>
          </button>
          <button onClick={() => { setCurrentPage('history'); setShowMenu(false); }}>
            <IconHistory size={18} />
            <span>Historique</span>
          </button>
          <button onClick={() => { setCurrentPage('groups'); setShowMenu(false); }}>
            <IconUsers size={18} />
            <span>Groupes</span>
            {notifCount > 0 && (
              <span className="nav-badge">{notifCount}</span>
            )}
          </button>
          <button onClick={() => { setCurrentPage('settings'); setShowMenu(false); }}>
            <IconSettings size={18} />
            <span>Paramètres</span>
          </button>
          <button onClick={handleLogout} className="logout-mobile">
            <IconLogout size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;