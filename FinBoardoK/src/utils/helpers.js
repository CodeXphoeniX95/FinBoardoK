import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

// ==================== CALCULS STATISTIQUES ====================

export const calculateStats = (actions, period = 'all') => {
  const filteredActions = filterByPeriod(actions, period);

  const depenses = filteredActions
    .filter(a => a.type === 'DEPENSE')
    .reduce((sum, a) => sum + a.amount, 0);

  const revenus = filteredActions
    .filter(a => a.type === 'REVENU')
    .reduce((sum, a) => sum + a.amount, 0);

  const epargne = filteredActions
    .filter(a => a.type === 'EPARGNE')
    .reduce((sum, a) => sum + a.amount, 0);

  return {
    totalBalance: revenus - depenses - epargne,
    totalDepenses: depenses,
    totalRevenus: revenus,
    totalEpargne: epargne
  };
};

// ==================== FILTRES PAR PÉRIODE ====================

export const filterByPeriod = (actions, period) => {
  const now = new Date();

  switch (period) {
    case 'today':
      return actions.filter(a => {
        const actionDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        return format(actionDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      });

    case 'week':
      return actions.filter(a => {
        const actionDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        return isWithinInterval(actionDate, {
          start: startOfWeek(now, { locale: fr }),
          end: endOfWeek(now, { locale: fr })
        });
      });

    case 'month':
      return actions.filter(a => {
        const actionDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        return isWithinInterval(actionDate, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
      });

    case 'year':
      return actions.filter(a => {
        const actionDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        return actionDate.getFullYear() === now.getFullYear();
      });

    default:
      return actions;
  }
};

// ==================== FORMATAGE ====================

export const formatAmount = (amount, currency = 'FCFA') => {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
};

export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  return format(dateObj, formatStr, { locale: fr });
};

// ==================== CATÉGORIES ====================

export const DEFAULT_CATEGORIES = [
  { id: 'nourriture', name: 'Nourriture', icon: '🍔', color: '#EF4444' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#F59E0B' },
  { id: 'logement', name: 'Logement', icon: '🏠', color: '#3B82F6' },
  { id: 'business', name: 'Business', icon: '💼', color: '#8B5CF6' },
  { id: 'loisirs', name: 'Loisirs', icon: '🎮', color: '#EC4899' },
  { id: 'sante', name: 'Santé', icon: '⚕️', color: '#10B981' },
  { id: 'education', name: 'Éducation', icon: '📚', color: '#06B6D4' },
  { id: 'autres', name: 'Autres', icon: '📦', color: '#6B7280' }
];

export const getCategoryById = (categoryId) => {
  return DEFAULT_CATEGORIES.find(c => c.id === categoryId) || DEFAULT_CATEGORIES[7];
};

// ==================== EXPORT DONNÉES ====================

export const exportToCSV = (data, filename = 'fintrack_export.csv') => {
  const headers = ['Date', 'Type', 'Montant', 'Description', 'Catégorie'];
  const rows = data.map(item => [
    formatDate(item.date, 'dd/MM/yyyy'),
    item.type,
    item.amount,
    item.description || '',
    item.category || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// ==================== VALIDATION ====================

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateAmount = (amount) => {
  return !isNaN(amount) && amount > 0;
};

export const validateBudget = (budgetData) => {
  const errors = {};

  if (!budgetData.name || budgetData.name.trim() === '') {
    errors.name = 'Le nom du budget est requis';
  }

  if (budgetData.type === 'FIXE' && (!budgetData.initialAmount || budgetData.initialAmount <= 0)) {
    errors.initialAmount = 'Le montant initial est requis pour un budget fixe';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAction = (actionData) => {
  const errors = {};

  if (!actionData.amount || actionData.amount <= 0) {
    errors.amount = 'Le montant doit être supérieur à 0';
  }

  if (!actionData.description || actionData.description.trim() === '') {
    errors.description = 'La description est requise';
  }

  if (!actionData.budgetId) {
    errors.budgetId = 'Vous devez sélectionner un budget';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};