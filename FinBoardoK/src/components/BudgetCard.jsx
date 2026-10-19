import { useState, useEffect } from 'react';
import { getBudgets, createBudget, deleteBudget } from '../utils/data';
import { formatAmount, validateBudget } from '../utils/helpers';
import { IconPlus, IconTrash, IconPin, IconRefresh, IconX, IconWallet } from './Icons';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EVOLUTIF',
    initialAmount: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const result = await getBudgets();
    if (result.success) {
      setBudgets(result.data);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const budgetData = {
      ...formData,
      initialAmount: parseFloat(formData.initialAmount) || 0
    };

    const validation = validateBudget(budgetData);
    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    setLoading(true);
    const result = await createBudget(budgetData);

    if (result.success) {
      setShowForm(false);
      setFormData({ name: '', type: 'EVOLUTIF', initialAmount: '' });
      loadBudgets();
    } else {
      setError(result.error || 'Erreur lors de la création');
    }
    setLoading(false);
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      const result = await deleteBudget(budgetId);
      if (result.success) {
        loadBudgets();
      }
    }
  };

  return (
    <div className="budgets-page">
      <div className="page-header">
        <div>
          <h1>Mes Budgets</h1>
          <p className="subtitle">Gérez vos enveloppes budgétaires et suivez vos allocations</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <IconPlus size={18} />
          <span>Nouveau budget</span>
        </button>
      </div>

      <div className="budgets-list">
        {budgets.length === 0 ? (
          <div className="empty-state">
            <IconWallet size={48} className="empty-icon" />
            <p className="empty-title">Aucun budget configuré</p>
            <p className="empty-desc">Commencez par créer votre première enveloppe budgétaire !</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <IconPlus size={18} />
              <span>Créer un budget</span>
            </button>
          </div>
        ) : (
          budgets.map(budget => (
            <div key={budget.id} className="budget-card">
              <div className="budget-card-header">
                <div>
                  <h3>{budget.name}</h3>
                  <span className={`budget-badge ${budget.type.toLowerCase()}`}>
                    {budget.type === 'FIXE' ? (
                      <><IconPin size={12} /> Fixe</>
                    ) : (
                      <><IconRefresh size={12} /> Évolutif</>
                    )}
                  </span>
                </div>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(budget.id)}
                  title="Supprimer le budget"
                >
                  <IconTrash size={16} />
                </button>
              </div>

              <div className="budget-card-body">
                <div className="budget-info">
                  <span className="label">Solde actuel</span>
                  <span className="value">{formatAmount(budget.currentBalance || 0)}</span>
                </div>

                {budget.type === 'FIXE' && (
                  <div className="budget-info">
                    <span className="label">Montant initial</span>
                    <span className="value">{formatAmount(budget.initialAmount || 0)}</span>
                  </div>
                )}

                {budget.type === 'FIXE' && budget.initialAmount > 0 && (
                  <div className="budget-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${Math.max(0, Math.min(100, (budget.currentBalance / budget.initialAmount) * 100))}%` 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round(Math.max(0, Math.min(100, (budget.currentBalance / budget.initialAmount) * 100)))}% restant
                    </span>
                  </div>
                )}
              </div>

              <div className="budget-card-footer">
                <small>
                  Créé le {budget.createdAt?.toDate().toLocaleDateString('fr-FR') || 'Récemment'}
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal création budget */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer un budget</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="budget-form">
              <div className="form-group">
                <label>Nom du budget</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Budget Mensuel, Transport, Projets"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type de budget</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={formData.type === 'FIXE' ? 'type-btn active' : 'type-btn'}
                    onClick={() => setFormData({ ...formData, type: 'FIXE' })}
                  >
                    <IconPin size={16} />
                    <span>Fixe</span>
                    <small>Plafond défini au départ</small>
                  </button>
                  <button
                    type="button"
                    className={formData.type === 'EVOLUTIF' ? 'type-btn active' : 'type-btn'}
                    onClick={() => setFormData({ ...formData, type: 'EVOLUTIF' })}
                  >
                    <IconRefresh size={16} />
                    <span>Évolutif</span>
                    <small>Flux de dépenses et revenus libres</small>
                  </button>
                </div>
              </div>

              {formData.type === 'FIXE' && (
                <div className="form-group">
                  <label>Montant initial (FCFA)</label>
                  <input
                    type="number"
                    name="initialAmount"
                    value={formData.initialAmount}
                    onChange={handleChange}
                    placeholder="50000"
                    required={formData.type === 'FIXE'}
                    min="0"
                    step="1"
                  />
                </div>
              )}

              {formData.type === 'EVOLUTIF' && (
                <div className="form-group">
                  <label>Montant initial (optionnel)</label>
                  <input
                    type="number"
                    name="initialAmount"
                    value={formData.initialAmount}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  <small className="form-hint">
                    Laissez vide pour démarrer avec un solde à 0 FCFA
                  </small>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;