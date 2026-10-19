import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { getActions, getBudgets } from '../utils/data';
import { calculateStats, filterByPeriod, formatAmount, DEFAULT_CATEGORIES } from '../utils/helpers';
import ActionForm from './ActionForm';
import { 
  IconWallet, 
  IconTrendingDown, 
  IconTrendingUp, 
  IconPiggyBank, 
  IconPlus, 
  IconPin, 
  IconRefresh 
} from './Icons';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function Dashboard() {
  const [actions, setActions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalDepenses: 0,
    totalRevenus: 0,
    totalEpargne: 0
  });
  const [showActionForm, setShowActionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (actions.length > 0) {
      const calculatedStats = calculateStats(actions, period);
      setStats(calculatedStats);
    }
  }, [actions, period]);

  const loadData = async () => {
    setLoading(true);
    const [actionsResult, budgetsResult] = await Promise.all([
      getActions(),
      getBudgets()
    ]);

    if (actionsResult.success) {
      setActions(actionsResult.data);
    }
    if (budgetsResult.success) {
      setBudgets(budgetsResult.data);
    }
    setLoading(false);
  };

  const getCategoryData = () => {
    const filteredActions = filterByPeriod(actions, period).filter(a => a.type === 'DEPENSE');
    const categoryTotals = {};

    filteredActions.forEach(action => {
      const category = action.category || 'autres';
      categoryTotals[category] = (categoryTotals[category] || 0) + action.amount;
    });

    const labels = Object.keys(categoryTotals).map(cat => {
      const categoryData = DEFAULT_CATEGORIES.find(c => c.id === cat);
      return categoryData ? categoryData.name : 'Autres';
    });

    const data = Object.values(categoryTotals);
    const colors = Object.keys(categoryTotals).map(cat => {
      const categoryData = DEFAULT_CATEGORIES.find(c => c.id === cat);
      return categoryData ? categoryData.color : '#6B7280';
    });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
      }]
    };
  };

  const getEvolutionData = () => {
    const filteredActions = filterByPeriod(actions, period);
    const sortedActions = [...filteredActions].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });

    let balance = 0;
    const labels = [];
    const data = [];

    sortedActions.forEach(action => {
      const date = action.date?.toDate ? action.date.toDate() : new Date(action.date);
      labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));

      if (action.type === 'REVENU') {
        balance += action.amount;
      } else {
        balance -= action.amount;
      }
      data.push(balance);
    });

    return {
      labels,
      datasets: [{
        label: 'Solde (FCFA)',
        data,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#6366F1',
        pointRadius: 3
      }]
    };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="subtitle">Vue d'ensemble et analyse de vos activités financières</p>
        </div>
        <button className="btn-primary" onClick={() => setShowActionForm(true)}>
          <IconPlus size={18} />
          <span>Nouvelle transaction</span>
        </button>
      </div>

      {/* Sélecteur de période */}
      <div className="period-selector">
        <button 
          className={period === 'today' ? 'period-btn active' : 'period-btn'}
          onClick={() => setPeriod('today')}
        >
          Aujourd'hui
        </button>
        <button 
          className={period === 'week' ? 'period-btn active' : 'period-btn'}
          onClick={() => setPeriod('week')}
        >
          Semaine
        </button>
        <button 
          className={period === 'month' ? 'period-btn active' : 'period-btn'}
          onClick={() => setPeriod('month')}
        >
          Mois
        </button>
        <button 
          className={period === 'year' ? 'period-btn active' : 'period-btn'}
          onClick={() => setPeriod('year')}
        >
          Année
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <div className="stat-card balance">
          <div className="stat-icon-wrapper">
            <IconWallet size={24} />
          </div>
          <div className="stat-content">
            <h3>Solde Total</h3>
            <p className="stat-amount">{formatAmount(stats.totalBalance)}</p>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon-wrapper">
            <IconTrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>Dépenses</h3>
            <p className="stat-amount">{formatAmount(stats.totalDepenses)}</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <IconTrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Revenus</h3>
            <p className="stat-amount">{formatAmount(stats.totalRevenus)}</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-wrapper">
            <IconPiggyBank size={24} />
          </div>
          <div className="stat-content">
            <h3>Épargne</h3>
            <p className="stat-amount">{formatAmount(stats.totalEpargne)}</p>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-container">
        <div className="chart-box">
          <div className="chart-header">
            <h3>Répartition des dépenses</h3>
          </div>
          {stats.totalDepenses > 0 ? (
            <div className="chart-wrapper">
              <Pie data={getCategoryData()} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="no-data">Aucune dépense enregistrée sur cette période</p>
          )}
        </div>

        <div className="chart-box">
          <div className="chart-header">
            <h3>Évolution du solde</h3>
          </div>
          {actions.length > 0 ? (
            <div className="chart-wrapper">
              <Line 
                data={getEvolutionData()} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          ) : (
            <p className="no-data">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Aperçu des budgets */}
      <div className="budgets-overview">
        <div className="overview-header">
          <h3>Budgets actifs</h3>
        </div>
        {budgets.length > 0 ? (
          <div className="budgets-grid">
            {budgets.slice(0, 3).map(budget => (
              <div key={budget.id} className="budget-card-mini">
                <div className="mini-header">
                  <h4>{budget.name}</h4>
                  <span className={`budget-badge ${budget.type.toLowerCase()}`}>
                    {budget.type === 'FIXE' ? (
                      <><IconPin size={12} /> Fixe</>
                    ) : (
                      <><IconRefresh size={12} /> Évolutif</>
                    )}
                  </span>
                </div>
                <p className="budget-balance">{formatAmount(budget.currentBalance || 0)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">Aucun budget actif. Créez-en un pour commencer !</p>
        )}
      </div>

      {/* Modal formulaire action */}
      {showActionForm && (
        <ActionForm 
          budgets={budgets}
          onClose={() => setShowActionForm(false)}
          onSuccess={() => {
            setShowActionForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;