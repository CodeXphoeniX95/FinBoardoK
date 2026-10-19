import { useState } from 'react';
import { logout } from '../utils/data';
import { IconDownload, IconTrash, IconLogout, IconSettings, IconWallet } from './Icons';

function Settings() {
  const [currency, setCurrency] = useState('FCFA');
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout();
      window.location.reload();
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p className="subtitle">Gérez vos préférences et la sécurité de votre compte</p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Préférences */}
        <div className="settings-section">
          <div className="section-title">
            <IconSettings size={20} />
            <h3>Préférences d'affichage</h3>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Devise principale</h4>
              <p>Monnaie utilisée pour l'affichage de vos soldes</p>
            </div>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="setting-select"
            >
              <option value="FCFA">FCFA (XOF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar US (USD)</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Notifications & Alertes</h4>
              <p>Recevoir des rappels de suivi de budget</p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Données & Sécurité */}
        <div className="settings-section">
          <div className="section-title">
            <IconWallet size={20} />
            <h3>Données & Sécurité</h3>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Exporter les données</h4>
              <p>Télécharger vos transactions au format CSV</p>
            </div>
            <button className="btn-secondary">
              <IconDownload size={16} />
              <span>Exporter</span>
            </button>
          </div>

          <div className="setting-item danger">
            <div className="setting-info">
              <h4>Supprimer le compte</h4>
              <p>Supprimer définitivement vos données financières</p>
            </div>
            <button className="btn-danger">
              <IconTrash size={16} />
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        {/* À propos */}
        <div className="settings-section">
          <div className="about-info">
            <div className="settings-brand-header">
              <img src="/logo.png" alt="Heleanaf Logo" className="settings-logo-img" />
              <h4>Heleanaf Enterprise v1.0</h4>
            </div>
            <p>
              Plateforme moderne de gestion financière personnelle et collaborative.
            </p>
            <div className="tech-stack-badges">
              <span>React 19</span>
              <span>Supabase</span>
              <span>Chart.js</span>
            </div>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="settings-section">
          <button className="btn-logout" onClick={handleLogout}>
            <IconLogout size={18} />
            <span>Se déconnecter de la session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;