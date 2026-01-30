import { useState, useEffect } from 'react';
import { getGroups, createGroup, addCotisation, getCotisations } from '../utils/data';
import { formatAmount, formatDate } from '../utils/helpers';
import { Timestamp } from 'firebase/firestore';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showCotisationForm, setShowCotisationForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    cotisationType: 'FIXE',
    fixedAmount: ''
  });
  const [cotisationForm, setCotisationForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadCotisations(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    const result = await getGroups();
    if (result.success) {
      setGroups(result.data);
    }
  };

  const loadCotisations = async (groupId) => {
    const result = await getCotisations(groupId);
    if (result.success) {
      setCotisations(result.data);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const groupData = {
      ...groupForm,
      fixedAmount: parseFloat(groupForm.fixedAmount) || 0
    };

    const result = await createGroup(groupData);
    if (result.success) {
      setShowGroupForm(false);
      setGroupForm({ name: '', cotisationType: 'FIXE', fixedAmount: '' });
      loadGroups();
    }
    setLoading(false);
  };

  const handleAddCotisation = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cotisationData = {
      amount: selectedGroup.cotisationType === 'FIXE' 
        ? selectedGroup.fixedAmount 
        : parseFloat(cotisationForm.amount),
      date: Timestamp.fromDate(new Date(cotisationForm.date))
    };

    const result = await addCotisation(selectedGroup.id, cotisationData);
    if (result.success) {
      setShowCotisationForm(false);
      setCotisationForm({ amount: '', date: new Date().toISOString().split('T')[0] });
      loadCotisations(selectedGroup.id);
    }
    setLoading(false);
  };

  const calculateGroupStats = (groupCotisations) => {
    const total = groupCotisations.reduce((sum, c) => sum + c.amount, 0);
    const count = groupCotisations.length;
    return { total, count };
  };

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1>Groupes de cotisation</h1>
        <button className="btn-primary" onClick={() => setShowGroupForm(true)}>
          + Nouveau groupe
        </button>
      </div>

      <div className="groups-container">
        {/* Liste des groupes */}
        <div className="groups-sidebar">
          <h3>Mes groupes</h3>
          {groups.length === 0 ? (
            <p className="empty-message">Aucun groupe créé</p>
          ) : (
            <div className="groups-list">
              {groups.map(group => (
                <div
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <h4>👥 {group.name}</h4>
                  <p className="group-type">
                    {group.cotisationType === 'FIXE' 
                      ? `${formatAmount(group.fixedAmount)} / personne` 
                      : 'Montant variable'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détails du groupe sélectionné */}
        <div className="group-details">
          {selectedGroup ? (
            <>
              <div className="group-header">
                <h2>{selectedGroup.name}</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCotisationForm(true)}
                >
                  + Ajouter une cotisation
                </button>
              </div>

              <div className="group-stats">
                <div className="stat-card">
                  <h4>Total cotisé</h4>
                  <p className="amount">
                    {formatAmount(calculateGroupStats(cotisations).total)}
                  </p>
                </div>
                <div className="stat-card">
                  <h4>Nombre de cotisations</h4>
                  <p className="amount">{calculateGroupStats(cotisations).count}</p>
                </div>
                <div className="stat-card">
                  <h4>Membres</h4>
                  <p className="amount">{selectedGroup.members?.length || 1}</p>
                </div>
              </div>

              <div className="cotisations-list">
                <h3>Historique des cotisations</h3>
                {cotisations.length === 0 ? (
                  <p className="empty-message">Aucune cotisation enregistrée</p>
                ) : (
                  <div className="cotisations-table">
                    {cotisations.map(cotisation => (
                      <div key={cotisation.id} className="cotisation-row">
                        <div className="cotisation-date">
                          {formatDate(cotisation.date, 'dd MMM yyyy')}
                        </div>
                        <div className="cotisation-amount">
                          {formatAmount(cotisation.amount)}
                        </div>
                        <div className="cotisation-user">
                          Vous
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>👈 Sélectionnez un groupe pour voir les détails</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal création groupe */}
      {showGroupForm && (
        <div className="modal-overlay" onClick={() => setShowGroupForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un groupe</h2>
              <button className="close-btn" onClick={() => setShowGroupForm(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Nom du groupe</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Ex: Cotisation Promo 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type de cotisation</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={groupForm.cotisationType === 'FIXE' ? 'type-btn active' : 'type-btn'}
                    onClick={() => setGroupForm({ ...groupForm, cotisationType: 'FIXE' })}
                  >
                    📌 Montant fixe
                    <small>Tout le monde cotise le même montant</small>
                  </button>
                  <button
                    type="button"
                    className={groupForm.cotisationType === 'VARIABLE' ? 'type-btn active' : 'type-btn'}
                    onClick={() => setGroupForm({ ...groupForm, cotisationType: 'VARIABLE' })}
                  >
                    🔄 Montant variable
                    <small>Chacun cotise à sa guise</small>
                  </button>
                </div>
              </div>

              {groupForm.cotisationType === 'FIXE' && (
                <div className="form-group">
                  <label>Montant fixe (FCFA)</label>
                  <input
                    type="number"
                    value={groupForm.fixedAmount}
                    onChange={(e) => setGroupForm({ ...groupForm, fixedAmount: e.target.value })}
                    placeholder="5000"
                    required
                    min="0"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGroupForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ajout cotisation */}
      {showCotisationForm && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowCotisationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter une cotisation</h2>
              <button className="close-btn" onClick={() => setShowCotisationForm(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCotisation}>
              {selectedGroup.cotisationType === 'VARIABLE' && (
                <div className="form-group">
                  <label>Montant (FCFA)</label>
                  <input
                    type="number"
                    value={cotisationForm.amount}
                    onChange={(e) => setCotisationForm({ ...cotisationForm, amount: e.target.value })}
                    placeholder="5000"
                    required
                    min="0"
                  />
                </div>
              )}

              {selectedGroup.cotisationType === 'FIXE' && (
                <div className="form-group">
                  <label>Montant</label>
                  <input
                    type="text"
                    value={formatAmount(selectedGroup.fixedAmount)}
                    disabled
                  />
                  <small className="form-hint">Montant fixe défini par le groupe</small>
                </div>
              )}

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={cotisationForm.date}
                  onChange={(e) => setCotisationForm({ ...cotisationForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCotisationForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;