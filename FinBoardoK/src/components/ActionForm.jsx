import { useState } from 'react';
import { createAction } from '../utils/data';
import { DEFAULT_CATEGORIES, validateAction } from '../utils/helpers';
import { Timestamp } from 'firebase/firestore';

function ActionForm({ budgets, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'DEPENSE',
    amount: '',
    description: '',
    budgetId: budgets[0]?.id || '',
    category: 'autres',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Validation
    const validation = validateAction({
      ...formData,
      amount: parseFloat(formData.amount)
    });

    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    setLoading(true);

    const actionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      budgetId: formData.budgetId,
      category: formData.category,
      date: Timestamp.fromDate(new Date(formData.date))
    };

    const result = await createAction(actionData);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajouter une action</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="action-form">
          <div className="form-group">
            <label>Type d'action</label>
            <div className="type-selector">
              <button
                type="button"
                className={formData.type === 'DEPENSE' ? 'type-btn active danger' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'DEPENSE' })}
              >
                📉 Dépense
              </button>
              <button
                type="button"
                className={formData.type === 'REVENU' ? 'type-btn active success' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'REVENU' })}
              >
                📈 Revenu
              </button>
              <button
                type="button"
                className={formData.type === 'EPARGNE' ? 'type-btn active info' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'EPARGNE' })}
              >
                🏦 Épargne
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Montant (FCFA)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="10000"
              required
              min="0"
              step="1"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ex: Courses du mois"
              required
            />
          </div>

          <div className="form-group">
            <label>Budget</label>
            <select
              name="budgetId"
              value={formData.budgetId}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un budget</option>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Catégorie</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActionForm;