import { useState } from 'react';
import { logout } from '../utils/data';

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
        <h1>Paramètres</h1>
      </div>

      <div className="settings-sections">
        {/* Préférences */}
        <div className="settings-section">
          <h3>Préférences</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Devise</h4>
              <p>Choisissez votre monnaie principale</p>
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
              <h4>Notifications</h4>
              <p>Recevoir des rappels et alertes</p>
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

        {/* Données */}
        <div className="settings-section">
          <h3>Données</h3>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Exporter mes données</h4>
              <p>Télécharger toutes vos données en CSV</p>
            </div>
            <button className="btn-secondary">
              📥 Exporter
            </button>
          </div>

          <div className="setting-item danger">
            <div className="setting-info">
              <h4>Supprimer mon compte</h4>
              <p>Cette action est irréversible</p>
            </div>
            <button className="btn-danger">
              🗑️ Supprimer
            </button>
          </div>
        </div>

        {/* À propos */}
        <div className="settings-section">
          <h3>À propos</h3>
          
          <div className="about-info">
            <h4>FinTrack v1.0</h4>
            <p>
              Votre assistant financier personnel intelligent.
              Développé avec ❤️ pour simplifier la gestion de vos finances.
            </p>
            <p className="tech-stack">
              React • Firebase • Chart.js
            </p>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="settings-section">
          <button className="btn-logout" onClick={handleLogout}>
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;