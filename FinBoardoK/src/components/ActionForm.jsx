import { useState } from 'react';
import { createAction } from '../utils/data';
import { DEFAULT_CATEGORIES, validateAction } from '../utils/helpers';
import { IconTrendingDown, IconTrendingUp, IconPiggyBank, IconX } from './Icons';

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
      date: formData.date
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
          <h2>Enregistrer une opération</h2>
          <button className="close-btn" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="action-form">
          <div className="form-group">
            <label>Type d'opération</label>
            <div className="type-selector">
              <button
                type="button"
                className={formData.type === 'DEPENSE' ? 'type-btn active danger' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'DEPENSE' })}
              >
                <IconTrendingDown size={16} />
                <span>Dépense</span>
              </button>
              <button
                type="button"
                className={formData.type === 'REVENU' ? 'type-btn active success' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'REVENU' })}
              >
                <IconTrendingUp size={16} />
                <span>Revenu</span>
              </button>
              <button
                type="button"
                className={formData.type === 'EPARGNE' ? 'type-btn active info' : 'type-btn'}
                onClick={() => setFormData({ ...formData, type: 'EPARGNE' })}
              >
                <IconPiggyBank size={16} />
                <span>Épargne</span>
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
              placeholder="Ex: 15000"
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
              placeholder="Ex: Achats de fournitures, Vente produit..."
              required
            />
          </div>

          <div className="form-group">
            <label>Budget rattaché</label>
            <select
              name="budgetId"
              value={formData.budgetId}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un budget</option>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.name} ({budget.type === 'FIXE' ? 'Fixe' : 'Évolutif'})
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
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date de l'opération</label>
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
              {loading ? 'Enregistrement...' : 'Valider la transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ActionForm;