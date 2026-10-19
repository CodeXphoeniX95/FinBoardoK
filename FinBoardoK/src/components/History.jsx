import { useState, useEffect } from 'react';
import { getActions, getBudgets, deleteAction } from '../utils/data';
import { formatAmount, formatDate, exportToCSV, getCategoryById } from '../utils/helpers';
import { 
  IconDownload, 
  IconTrash, 
  IconTrendingDown, 
  IconTrendingUp, 
  IconPiggyBank, 
  IconHistory, 
  IconCategory 
} from './Icons';

function History() {
  const [actions, setActions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterBudget, setFilterBudget] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [actionsRes, budgetsRes] = await Promise.all([
      getActions(),
      getBudgets()
    ]);

    if (actionsRes.success) {
      setActions(actionsRes.data);
    }
    if (budgetsRes.success) {
      setBudgets(budgetsRes.data);
    }
    setLoading(false);
  };

  const handleDelete = async (actionId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette transaction ?')) {
      const res = await deleteAction(actionId);
      if (res.success) {
        loadData();
      }
    }
  };

  const handleExport = () => {
    exportToCSV(filteredActions, `Heleanaf_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const filteredActions = actions.filter(action => {
    if (filterType !== 'ALL' && action.type !== filterType) return false;
    if (filterBudget !== 'ALL' && action.budgetId !== filterBudget) return false;
    return true;
  });

  const getBudgetName = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    return budget ? budget.name : 'Budget inconnu';
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loader"></div>
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1>Historique des opérations</h1>
          <p className="subtitle">Consultez, filtrez et exportez toutes vos transactions sous forme de tableau</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={filteredActions.length === 0}>
          <IconDownload size={18} />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="filters-container card">
        <div className="filter-group">
          <label>Type d'opération</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">Toutes les opérations</option>
            <option value="DEPENSE">Dépenses uniquement</option>
            <option value="REVENU">Revenus uniquement</option>
            <option value="EPARGNE">Épargnes uniquement</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Budget rattaché</label>
          <select value={filterBudget} onChange={(e) => setFilterBudget(e.target.value)}>
            <option value="ALL">Tous les budgets</option>
            {budgets.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="history-table-card card">
        {filteredActions.length === 0 ? (
          <div className="empty-state">
            <IconHistory size={48} className="empty-icon" />
            <p className="empty-title">Aucune transaction trouvée</p>
            <p className="empty-desc">Aucune opération ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description / Intitulé</th>
                  <th>Catégorie</th>
                  <th>Budget</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActions.map(action => {
                  const categoryObj = getCategoryById(action.category);
                  const isExpense = action.type === 'DEPENSE';
                  const isRevenue = action.type === 'REVENU';
                  const isSavings = action.type === 'EPARGNE';

                  return (
                    <tr key={action.id}>
                      <td>
                        <span className={`badge ${
                          isExpense ? 'badge-danger' : (isRevenue ? 'badge-success' : 'badge-info')
                        }`}>
                          {isExpense && <IconTrendingDown size={14} />}
                          {isRevenue && <IconTrendingUp size={14} />}
                          {isSavings && <IconPiggyBank size={14} />}
                          <span style={{ marginLeft: '4px' }}>{action.type}</span>
                        </span>
                      </td>
                      <td className="font-semibold">
                        {action.description || 'Transaction sans titre'}
                      </td>
                      <td>
                        <div className="category-cell">
                          <IconCategory name={action.category} size={16} />
                          <span>{categoryObj?.name || 'Général'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{getBudgetName(action.budgetId)}</span>
                      </td>
                      <td className="text-muted">{formatDate(action.date, 'dd MMM yyyy')}</td>
                      <td className={`amount-cell ${
                        isExpense ? 'text-danger' : (isRevenue ? 'text-success' : 'text-primary')
                      }`}>
                        {isExpense ? '-' : '+'}{formatAmount(action.amount)}
                      </td>
                      <td>
                        <button 
                          className="btn-icon danger-icon"
                          onClick={() => handleDelete(action.id)}
                          title="Supprimer la transaction"
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;