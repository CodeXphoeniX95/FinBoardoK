import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { 
  getGroups, 
  createGroup, 
  addCotisation, 
  createWithdrawalRequest,
  approveWithdrawalRequest,
  getWithdrawalRequests,
  getCotisations, 
  searchUsers, 
  addGroupMember, 
  getGroupMembers 
} from '../utils/data';
import { formatAmount, formatDate } from '../utils/helpers';
import { 
  IconUsers, 
  IconPlus, 
  IconUser, 
  IconSearch, 
  IconUserPlus, 
  IconShield, 
  IconArrowUpRight, 
  IconArrowDownRight, 
  IconMinusCircle, 
  IconX,
  IconCheck,
  IconPrinter,
  IconFileText
} from './Icons';

function Groups() {
  const [currentUser, setCurrentUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [cotisations, setCotisations] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'withdrawals' | 'members' | 'monthly'
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('ALL');
  const [expandedMonth, setExpandedMonth] = useState(null);

  // Inline Contextual Sheet State: null | 'cotisation' | 'withdrawal' | 'invite' | 'createGroup'
  const [activeContextForm, setActiveContextForm] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Forms state
  const [groupForm, setGroupForm] = useState({
    name: '',
    cotisationType: 'FIXE',
    fixedAmount: ''
  });
  const [cotisationForm, setCotisationForm] = useState({
    forUserId: '',
    amount: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Errors & Search state
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      setSelectedMemberFilter('ALL');
      setExpandedMonth(null);
      setActiveContextForm(null);
      loadCotisations(selectedGroup.id);
      loadMembers(selectedGroup.id);
      loadWithdrawalRequests(selectedGroup.id);
    }
  }, [selectedGroup]);

  const toggleContextForm = (formName) => {
    setFormError('');
    setInviteSuccessMsg('');
    if (activeContextForm === formName) {
      setActiveContextForm(null);
    } else {
      setActiveContextForm(formName);
    }
  };

  const loadGroups = async () => {
    const result = await getGroups();
    if (result.success) {
      setGroups(result.data);
      if (result.data.length > 0 && !selectedGroup) {
        setSelectedGroup(result.data[0]);
      }
    }
  };

  const loadCotisations = async (groupId) => {
    const result = await getCotisations(groupId);
    if (result.success) {
      setCotisations(result.data);
    }
  };

  const loadMembers = async (groupId) => {
    const result = await getGroupMembers(groupId);
    if (result.success) {
      setMembers(result.data);
    }
  };

  const loadWithdrawalRequests = async (groupId) => {
    const result = await getWithdrawalRequests(groupId);
    if (result.success) {
      setWithdrawalRequests(result.data);
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
      setActiveContextForm(null);
      setGroupForm({ name: '', cotisationType: 'FIXE', fixedAmount: '' });
      loadGroups();
    }
    setLoading(false);
  };

  const handleAddCotisation = async (e) => {
    e.preventDefault();
    setFormError('');

    const method = cotisationForm.paymentMethod;
    if ((method === 'TMONEY' || method === 'FLOOZ') && !cotisationForm.transactionRef.trim()) {
      setFormError(`Le N° de transaction est obligatoire pour un versement par ${method}.`);
      return;
    }

    setLoading(true);

    const cotisationData = {
      forUserId: cotisationForm.forUserId || null,
      amount: selectedGroup.cotisationType === 'FIXE' 
        ? selectedGroup.fixedAmount 
        : parseFloat(cotisationForm.amount),
      paymentMethod: method,
      transactionRef: cotisationForm.transactionRef,
      date: cotisationForm.date
    };

    const result = await addCotisation(selectedGroup.id, cotisationData);
    if (result.success) {
      setActiveContextForm(null);
      setCotisationForm({ 
        forUserId: '', 
        amount: '', 
        paymentMethod: 'CASH', 
        transactionRef: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      loadCotisations(selectedGroup.id);
    } else {
      setFormError(result.error);
    }
    setLoading(false);
  };

  const handleAddWithdrawalRequest = async (e) => {
    e.preventDefault();
    setFormError('');

    const method = withdrawalForm.paymentMethod;
    if ((method === 'TMONEY' || method === 'FLOOZ') && !withdrawalForm.transactionRef.trim()) {
      setFormError(`Le N° de transaction est obligatoire pour un retrait par ${method}.`);
      return;
    }

    setLoading(true);

    const withdrawalData = {
      amount: parseFloat(withdrawalForm.amount),
      description: withdrawalForm.description,
      paymentMethod: method,
      transactionRef: withdrawalForm.transactionRef,
      date: withdrawalForm.date
    };

    const result = await createWithdrawalRequest(selectedGroup.id, withdrawalData);
    if (result.success) {
      setActiveContextForm(null);
      setWithdrawalForm({ 
        amount: '', 
        description: '', 
        paymentMethod: 'CASH', 
        transactionRef: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      loadWithdrawalRequests(selectedGroup.id);
      loadCotisations(selectedGroup.id);
    } else {
      setFormError(result.error);
    }
    setLoading(false);
  };

  const handleApproveWithdrawal = async (req) => {
    setLoading(true);
    const result = await approveWithdrawalRequest(req.id, req.approvals, members.length);
    if (result.success) {
      loadWithdrawalRequests(selectedGroup.id);
      loadCotisations(selectedGroup.id);
    }
    setLoading(false);
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length >= 1) {
      setSearching(true);
      const res = await searchUsers(query);
      if (res.success) {
        setSearchResults(res.data);
      }
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleInviteUser = async (targetUser) => {
    if (!selectedGroup) return;
    setLoading(true);
    const res = await addGroupMember(selectedGroup.id, targetUser.id);
    if (res.success) {
      setInviteSuccessMsg(`Membre ${targetUser.fullName || targetUser.email} ajouté au groupe !`);
      setTimeout(() => setInviteSuccessMsg(''), 3000);
      loadMembers(selectedGroup.id);
      loadGroups();
    } else {
      alert(res.error || 'Erreur lors de l\'ajout du membre.');
    }
    setLoading(false);
  };

  const isAdmin = currentUser && selectedGroup && (selectedGroup.createdBy === currentUser.id);

  // Scope des cotisations : Admin voit tout / filtre membre - Membre voit uniquement SES cotisations
  const visibleCotisations = cotisations.filter(c => {
    const isForMe = (c.forUserId && c.forUserId === currentUser?.id) || c.userId === currentUser?.id;
    if (!isAdmin) {
      return isForMe;
    }
    if (selectedMemberFilter !== 'ALL') {
      return (c.forUserId && c.forUserId === selectedMemberFilter) || c.userId === selectedMemberFilter;
    }
    return true;
  });

  // Calculs Admin (Groupe Global)
  const totalCotisations = cotisations
    .filter(c => c.amount > 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalWithdrawals = cotisations
    .filter(c => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  const groupBalance = totalCotisations - totalWithdrawals;

  // Calculs Personnels de l'Utilisateur Connecté (Admin ou Membre)
  const myCotisations = cotisations.filter(c => 
    ((c.forUserId && c.forUserId === currentUser?.id) || c.userId === currentUser?.id)
  );

  const myTotalCotisations = myCotisations
    .filter(c => c.amount > 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const myTotalWithdrawals = myCotisations
    .filter(c => c.amount < 0)
    .reduce((sum, c) => sum + Math.abs(c.amount), 0);

  const myBalance = myTotalCotisations - myTotalWithdrawals;

  // Calcul du Rapport Mensuel (Regroupement par Mois + Liste détaillée des éléments)
  const monthlyReport = visibleCotisations.reduce((acc, c) => {
    const rawDate = c.date?.toDate ? c.date.toDate() : new Date(c.date);
    const monthKey = `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = rawDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    if (!acc[monthKey]) {
      acc[monthKey] = {
        key: monthKey,
        label: capitalizedMonth,
        cotisations: 0,
        retraits: 0,
        count: 0,
        items: []
      };
    }

    acc[monthKey].count += 1;
    acc[monthKey].items.push(c);

    if (c.amount > 0) {
      acc[monthKey].cotisations += c.amount;
    } else {
      acc[monthKey].retraits += Math.abs(c.amount);
    }

    return acc;
  }, {});

  const sortedMonthlyReport = Object.values(monthlyReport).sort((a, b) => b.key.localeCompare(a.key));

  return (
    <div className="groups-page">
      <div className="page-header">
        <div>
          <h1>Groupes & Tontines</h1>
          <p className="subtitle">Gestion des cagnottes, cotisations pour autrui et retraits sécurisés</p>
        </div>
        <button 
          className={`btn-primary ${activeContextForm === 'createGroup' ? 'active' : ''}`}
          onClick={() => toggleContextForm('createGroup')}
        >
          <IconPlus size={18} /> Nouveau groupe
        </button>
      </div>

      {/* Menu Contextuel Flottant au PREMIER PLAN (Foreground) avec Arrière-plan Flou (Background) */}
      {activeContextForm && (
        <div className="contextual-sheet-wrapper">
          <div className="contextual-sheet-backdrop" onClick={() => setActiveContextForm(null)}></div>
          
          <div className="contextual-sheet-card">
            {/* Contextual Form 1: Créer un nouveau groupe */}
            {activeContextForm === 'createGroup' && (
              <>
                <div className="contextual-form-header">
                  <div className="contextual-title-group">
                    <span className="contextual-icon"><IconUsers size={20} /></span>
                    <h4>Créer un nouveau groupe de tontine</h4>
                  </div>
                  <button className="close-sheet-btn" onClick={() => setActiveContextForm(null)}><IconX size={18} /></button>
                </div>
                <form onSubmit={handleCreateGroup}>
                  <div className="form-group">
                    <label>Nom du groupe</label>
                    <input
                      type="text"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder="Ex: Tontine Les Amis, Cagnotte Projet..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type de cotisation</label>
                    <select
                      value={groupForm.cotisationType}
                      onChange={(e) => setGroupForm({ ...groupForm, cotisationType: e.target.value })}
                    >
                      <option value="FIXE">Montant fixe par versement</option>
                      <option value="LIBRE">Montant libre par membre</option>
                    </select>
                  </div>

                  {groupForm.cotisationType === 'FIXE' && (
                    <div className="form-group">
                      <label>Montant fixe (FCFA)</label>
                      <input
                        type="number"
                        value={groupForm.fixedAmount}
                        onChange={(e) => setGroupForm({ ...groupForm, fixedAmount: e.target.value })}
                        placeholder="10000"
                        required
                      />
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setActiveContextForm(null)}>Annuler</button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Création en cours...' : 'Créer le groupe'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Contextual Form 2: Enregistrer une cotisation */}
            {activeContextForm === 'cotisation' && isAdmin && (
              <>
                <div className="contextual-form-header">
                  <div className="contextual-title-group">
                    <span className="contextual-icon"><IconPlus size={20} /></span>
                    <h4>Enregistrer une cotisation (Admin) - {selectedGroup?.name}</h4>
                  </div>
                  <button className="close-sheet-btn" onClick={() => setActiveContextForm(null)}><IconX size={18} /></button>
                </div>

                {formError && <div className="error-message">{formError}</div>}

                <form onSubmit={handleAddCotisation}>
                  <div className="form-group">
                    <label>Cotisation enregistrée pour :</label>
                    <select
                      value={cotisationForm.forUserId}
                      onChange={(e) => setCotisationForm({ ...cotisationForm, forUserId: e.target.value })}
                    >
                      <option value="">-- Moi-même (Admin) --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedGroup.cotisationType === 'FIXE' ? (
                    <div className="form-group">
                      <label>Montant de la cotisation (Fixe)</label>
                      <input type="text" value={formatAmount(selectedGroup.fixedAmount)} disabled />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Montant à verser (FCFA)</label>
                      <input
                        type="number"
                        value={cotisationForm.amount}
                        onChange={(e) => setCotisationForm({ ...cotisationForm, amount: e.target.value })}
                        placeholder="5000"
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Mode de paiement</label>
                    <select
                      value={cotisationForm.paymentMethod}
                      onChange={(e) => setCotisationForm({ ...cotisationForm, paymentMethod: e.target.value })}
                    >
                      <option value="CASH">Espèces / Cash</option>
                      <option value="TMONEY">TMoney (Togocom)</option>
                      <option value="FLOOZ">Flooz (Moov)</option>
                      <option value="VIREMENT">Virement bancaire</option>
                    </select>
                  </div>

                  {(cotisationForm.paymentMethod === 'TMONEY' || cotisationForm.paymentMethod === 'FLOOZ') && (
                    <div className="form-group">
                      <label className="text-danger">N° de transaction {cotisationForm.paymentMethod} (Obligatoire) *</label>
                      <input
                        type="text"
                        value={cotisationForm.transactionRef}
                        onChange={(e) => setCotisationForm({ ...cotisationForm, transactionRef: e.target.value })}
                        placeholder="Ex: TRX-981247921..."
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Date du versement</label>
                    <input
                      type="date"
                      value={cotisationForm.date}
                      onChange={(e) => setCotisationForm({ ...cotisationForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setActiveContextForm(null)}>Fermer</button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Enregistrement...' : 'Enregistrer la cotisation'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Contextual Form 3: Demander un retrait */}
            {activeContextForm === 'withdrawal' && (
              <>
                <div className="contextual-form-header">
                  <div className="contextual-title-group">
                    <span className="contextual-icon"><IconMinusCircle size={20} /></span>
                    <h4>Demander un retrait du groupe - {selectedGroup?.name}</h4>
                  </div>
                  <button className="close-sheet-btn" onClick={() => setActiveContextForm(null)}><IconX size={18} /></button>
                </div>

                {formError && <div className="error-message">{formError}</div>}

                <form onSubmit={handleAddWithdrawalRequest}>
                  <div className="form-group">
                    <label>Montant souhaité (FCFA)</label>
                    <input
                      type="number"
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                      placeholder="25000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Motif / Description du retrait</label>
                    <input
                      type="text"
                      value={withdrawalForm.description}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, description: e.target.value })}
                      placeholder="Ex: Achat matériel, Sortie de cagnotte tontine..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mode de réception</label>
                    <select
                      value={withdrawalForm.paymentMethod}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, paymentMethod: e.target.value })}
                    >
                      <option value="CASH">Espèces / Cash</option>
                      <option value="TMONEY">TMoney (Togocom)</option>
                      <option value="FLOOZ">Flooz (Moov)</option>
                    </select>
                  </div>

                  {(withdrawalForm.paymentMethod === 'TMONEY' || withdrawalForm.paymentMethod === 'FLOOZ') && (
                    <div className="form-group">
                      <label className="text-danger">N° de transaction {withdrawalForm.paymentMethod} *</label>
                      <input
                        type="text"
                        value={withdrawalForm.transactionRef}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, transactionRef: e.target.value })}
                        placeholder="Ex: TRX-981247921..."
                        required
                      />
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setActiveContextForm(null)}>Fermer</button>
                    <button type="submit" className="btn-danger" disabled={loading}>
                      {loading ? 'Demande en cours...' : 'Soumettre la demande'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Contextual Form 4: Inviter un membre */}
            {activeContextForm === 'invite' && isAdmin && (
              <>
                <div className="contextual-form-header">
                  <div className="contextual-title-group">
                    <span className="contextual-icon"><IconUserPlus size={20} /></span>
                    <h4>Inviter un membre au groupe (Admin)</h4>
                  </div>
                  <button className="close-sheet-btn" onClick={() => setActiveContextForm(null)}><IconX size={18} /></button>
                </div>

                {inviteSuccessMsg && (
                  <div className="success-message">
                    <IconCheck size={16} /> {inviteSuccessMsg}
                  </div>
                )}

                <div className="form-group">
                  <label>Rechercher un membre par e-mail ou pseudo</label>
                  <div className="search-input-wrapper">
                    <IconSearch size={18} className="search-icon" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      placeholder="Tapez le pseudo ou l'email..."
                    />
                  </div>
                </div>

                <div className="user-search-results">
                  {searching ? (
                    <p className="search-status">Recherche en cours...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(u => {
                      const isAlreadyMember = members.some(m => m.id === u.id);
                      return (
                        <div key={u.id} className="user-search-item">
                          <div className="user-search-info">
                            <div className="user-avatar">{u.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                            <div>
                              <h4>{u.full_name || u.email.split('@')[0]}</h4>
                              <p>{u.email}</p>
                            </div>
                          </div>
                          {isAlreadyMember ? (
                            <span className="badge badge-info">Déjà membre</span>
                          ) : (
                            <button className="btn-secondary btn-sm" onClick={() => handleInviteUser(u)}>
                              <IconUserPlus size={14} /> Inviter
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : searchQuery.trim().length >= 1 ? (
                    <p className="search-status">Aucun utilisateur trouvé.</p>
                  ) : (
                    <p className="search-hint">Saisissez au moins 1 lettre pour rechercher.</p>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setActiveContextForm(null)}>Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"><IconUsers size={48} /></div>
          <h3>Aucun groupe de tontine</h3>
          <p>Créez ou rejoignez un groupe pour commencer à cotiser ensemble</p>
          <button className="btn-primary" onClick={() => toggleContextForm('createGroup')}>
            Créer un groupe
          </button>
        </div>
      ) : (
        <div className="groups-layout">
          {/* Liste latérale des groupes */}
          <div className="groups-sidebar card">
            <h3>Mes Groupes ({groups.length})</h3>
            <div className="groups-list">
              {groups.map(group => (
                <button
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-item-icon">
                    <IconUsers size={20} />
                  </div>
                  <div className="group-item-info">
                    <h4>{group.name}</h4>
                    <p>{group.cotisationType === 'FIXE' ? `${formatAmount(group.fixedAmount)} / versement` : 'Cotisation libre'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Espace Détails du Groupe Sélectionné */}
          {selectedGroup && (
            <div className="group-details">
              {/* Header du groupe */}
              <div className="group-header-card card">
                <div className="group-title-row">
                  <div>
                    <h2>{selectedGroup.name}</h2>
                    <span className="badge badge-info">
                      {selectedGroup.cotisationType === 'FIXE' 
                        ? `Montant Fixe : ${formatAmount(selectedGroup.fixedAmount)}` 
                        : 'Cotisation Libre'}
                    </span>
                  </div>

                  <div className="group-header-actions">
                    {isAdmin ? (
                      <>
                        <button 
                          className={`btn-secondary ${activeContextForm === 'invite' ? 'active' : ''}`}
                          onClick={() => toggleContextForm('invite')}
                        >
                          <IconUserPlus size={16} /> Inviter des membres
                        </button>
                        <button 
                          className={`btn-primary ${activeContextForm === 'cotisation' ? 'active' : ''}`}
                          onClick={() => toggleContextForm('cotisation')}
                        >
                          <IconPlus size={16} /> Enregistrer cotisation
                        </button>
                      </>
                    ) : (
                      <span className="badge badge-info">
                        Mode Membre (Confidentialité activée)
                      </span>
                    )}

                    <button 
                      className={`btn-secondary ${activeContextForm === 'withdrawal' ? 'active' : ''}`}
                      onClick={() => toggleContextForm('withdrawal')}
                    >
                      <IconMinusCircle size={16} /> Demander un retrait
                    </button>
                  </div>
                </div>

                {/* Cartes de statistiques financières : Solde du Groupe + Cotisation Personnelle de l'Utilisateur Connecté */}
                {isAdmin ? (
                  <div className="group-stats-grid">
                    <div className="group-stat-card primary">
                      <div className="stat-label">Solde du groupe</div>
                      <div className="stat-value">{formatAmount(groupBalance)}</div>
                      <div className="stat-sub">Disponible en caisse (Admin)</div>
                    </div>
                    <div className="group-stat-card success">
                      <div className="stat-label">Total des cotisations</div>
                      <div className="stat-value"><IconArrowUpRight size={18} /> {formatAmount(totalCotisations)}</div>
                      <div className="stat-sub">{cotisations.filter(c => c.amount > 0).length} versements tous membres</div>
                    </div>
                    <div className="group-stat-card info">
                      <div className="stat-label">Ma cotisation personnelle</div>
                      <div className="stat-value"><IconUser size={18} /> {formatAmount(myTotalCotisations)}</div>
                      <div className="stat-sub">Votre versement individuel</div>
                    </div>
                    <div className="group-stat-card danger">
                      <div className="stat-label">Total des retraits</div>
                      <div className="stat-value"><IconArrowDownRight size={18} /> {formatAmount(totalWithdrawals)}</div>
                      <div className="stat-sub">{cotisations.filter(c => c.amount < 0).length} retraits validés</div>
                    </div>
                  </div>
                ) : (
                  <div className="group-stats-grid">
                    <div className="group-stat-card primary">
                      <div className="stat-label">Mon solde cotisé</div>
                      <div className="stat-value">{formatAmount(myBalance)}</div>
                      <div className="stat-sub">Votre solde personnel</div>
                    </div>
                    <div className="group-stat-card success">
                      <div className="stat-label">Ma cotisation totale</div>
                      <div className="stat-value"><IconArrowUpRight size={18} /> {formatAmount(myTotalCotisations)}</div>
                      <div className="stat-sub">{myCotisations.filter(c => c.amount > 0).length} versements par vous</div>
                    </div>
                    <div className="group-stat-card danger">
                      <div className="stat-label">Mes retraits reçus</div>
                      <div className="stat-value"><IconArrowDownRight size={18} /> {formatAmount(myTotalWithdrawals)}</div>
                      <div className="stat-sub">{myCotisations.filter(c => c.amount < 0).length} retraits personnels</div>
                    </div>
                    <div className="group-stat-card info">
                      <div className="stat-label">Votre rôle</div>
                      <div className="stat-value"><IconUser size={18} /> Membre</div>
                      <div className="stat-sub">Données privées</div>
                    </div>
                  </div>
                )}

                {/* Onglets Navigation Groupe */}
                <div className="group-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                  >
                    Cotisations ({visibleCotisations.length})
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdrawals')}
                  >
                    Validations des Retraits ({withdrawalRequests.filter(r => r.status === 'EN_ATTENTE').length})
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                  >
                    Membres ({members.length})
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                  >
                    <IconFileText size={16} /> Rapport Mensuel ({sortedMonthlyReport.length})
                  </button>
                </div>
              </div>

              {/* Onglet 1: Cotisations & Transactions */}
              {activeTab === 'transactions' && (
                <div className="group-content-card card">
                  <div className="members-tab-header">
                    <div>
                      <h3>{isAdmin ? "Historique complet des cotisations du groupe" : "Mes cotisations et reçus personnels"}</h3>
                      <p className="subtitle">
                        {isAdmin 
                          ? "Vue d'ensemble administrateur - Filtrage par membre disponible" 
                          : "Seules vos cotisations et vos retraits personnels sont affichés"}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="filter-group-inline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--slate-700)' }}>
                          Filtrer par membre :
                        </label>
                        <select
                          value={selectedMemberFilter}
                          onChange={(e) => setSelectedMemberFilter(e.target.value)}
                          style={{ 
                            padding: '0.45rem 2.2rem 0.45rem 0.85rem', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1.5px solid var(--slate-300)', 
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            backgroundColor: 'var(--white)' 
                          }}
                        >
                          <option value="ALL">Tous les membres ({members.length})</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.fullName} ({m.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {visibleCotisations.length === 0 ? (
                    <div className="empty-substate">
                      <p>{isAdmin ? "Aucune transaction enregistrée pour ce membre/groupe." : "Vous n'avez pas encore de cotisation enregistrée."}</p>
                      {isAdmin && (
                        <button className="btn-secondary" onClick={() => toggleContextForm('cotisation')}>
                          Enregistrer une première cotisation
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Bénéficiaire / Auteur</th>
                            <th>Mode / Réf</th>
                            <th>Date</th>
                            <th>Montant</th>
                            <th>Reçu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleCotisations.map(c => {
                            const isWithdrawal = c.amount < 0;
                            return (
                              <tr key={c.id}>
                                <td>
                                  <span className={`badge ${isWithdrawal ? 'badge-danger' : 'badge-success'}`}>
                                    {isWithdrawal ? 'Retrait' : 'Cotisation'}
                                  </span>
                                </td>
                                <td>
                                  <div className="user-table-cell">
                                    <IconUser size={16} />
                                    <span>{c.userName}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="payment-method-tag">
                                    <span className="method-name">{c.paymentMethod}</span>
                                    {c.transactionRef && (
                                      <span className="ref-code" title="N° de transaction">{c.transactionRef}</span>
                                    )}
                                  </div>
                                </td>
                                <td>{formatDate(c.date)}</td>
                                <td className={`amount-cell ${isWithdrawal ? 'text-danger' : 'text-success'}`}>
                                  {isWithdrawal ? '-' : '+'}{formatAmount(Math.abs(c.amount))}
                                </td>
                                <td>
                                  <button 
                                    className="btn-icon" 
                                    onClick={() => setSelectedReceipt(c)}
                                    title="Imprimer le reçu de paiement"
                                  >
                                    <IconPrinter size={16} />
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
              )}

              {/* Onglet 2: Confirmations / Approbations de Retrait Multi-Membres avec identification claire du demandeur */}
              {activeTab === 'withdrawals' && (
                <div className="group-content-card card">
                  <div className="members-tab-header">
                    <div>
                      <h3>Demandes de retraits en attente de confirmation</h3>
                      <p className="subtitle">Identification claire de l'auteur de la demande & validation par les membres</p>
                    </div>
                    <button className="btn-secondary" onClick={() => toggleContextForm('withdrawal')}>
                      <IconMinusCircle size={16} /> Nouvelle demande de retrait
                    </button>
                  </div>

                  {withdrawalRequests.length === 0 ? (
                    <div className="empty-substate">
                      <p>Aucune demande de retrait en attente.</p>
                    </div>
                  ) : (
                    <div className="withdrawals-list">
                      {withdrawalRequests.map(req => {
                        const isApproved = req.status === 'APPROUVE';
                        const confirmationsCount = req.approvals?.length || 0;
                        const totalMembersCount = Math.max(members.length, 1);
                        const progressPercent = Math.min(100, Math.round((confirmationsCount / totalMembersCount) * 100));

                        return (
                          <div key={req.id} className="withdrawal-card">
                            <div className="withdrawal-card-header">
                              <div>
                                <h4>{req.description || 'Demande de retrait'}</h4>
                                <p className="withdrawal-meta" style={{ marginTop: '0.25rem', color: 'var(--slate-600)' }}>
                                  Demandé par : <strong style={{ color: 'var(--slate-900)' }}>{req.requesterName}</strong> • {formatDate(req.createdAt)}
                                </p>
                              </div>
                              <div className="withdrawal-amount">
                                -{formatAmount(req.amount)}
                              </div>
                            </div>

                            <div className="withdrawal-details-row">
                              <span className="payment-method-tag">
                                Mode: <strong>{req.paymentMethod}</strong>
                                {req.transactionRef && ` • Réf N°: ${req.transactionRef}`}
                              </span>
                              <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                                {isApproved ? '✓ APPROUVÉ' : `EN ATTENTE (${confirmationsCount}/${totalMembersCount})`}
                              </span>
                            </div>

                            <div className="approval-progress-wrapper">
                              <div className="approval-progress-bar">
                                <div className="approval-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                              </div>
                              <span className="approval-percent">{progressPercent}% confirmé</span>
                            </div>

                            {!isApproved && (
                              <div className="withdrawal-card-actions">
                                <button 
                                  className="btn-primary btn-sm"
                                  onClick={() => handleApproveWithdrawal(req)}
                                  disabled={loading}
                                >
                                  <IconCheck size={14} /> Confirmer ce retrait
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet 3: Membres & Invitations */}
              {activeTab === 'members' && (
                <div className="group-content-card card">
                  <div className="members-tab-header">
                    <div>
                      <h3>Membres inscrits du groupe ({members.length})</h3>
                      <p className="subtitle">Seul l'administrateur peut ajouter de nouveaux membres</p>
                    </div>
                    {isAdmin && (
                      <button className="btn-primary" onClick={() => toggleContextForm('invite')}>
                        <IconUserPlus size={16} /> Ajouter un utilisateur
                      </button>
                    )}
                  </div>

                  <div className="members-grid">
                    {members.map(m => (
                      <div key={m.id} className="member-card">
                        <div className="member-avatar">
                          {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="member-info">
                          <h4>{m.fullName}</h4>
                          <p>{m.email}</p>
                        </div>
                        {m.role === 'admin' && (
                          <span className="badge badge-warning" title="Administrateur du groupe">
                            <IconShield size={12} /> Admin
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Onglet 4: Rapport Mensuel Interactif avec Détails dépliables (Consultation complète) */}
              {activeTab === 'monthly' && (
                <div className="group-content-card card">
                  <div className="members-tab-header">
                    <div>
                      <h3><IconFileText size={18} /> Rapport et Bilan Mensuel</h3>
                      <p className="subtitle">
                        Cliquez sur un mois pour déplier et consulter l'historique complet et les auteurs des transactions
                      </p>
                    </div>
                  </div>

                  {sortedMonthlyReport.length === 0 ? (
                    <div className="empty-substate">
                      <p>Aucune transaction enregistrée pour générer le rapport mensuel.</p>
                    </div>
                  ) : (
                    <div className="monthly-report-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {sortedMonthlyReport.map(m => {
                        const monthBalance = m.cotisations - m.retraits;
                        const isExpanded = expandedMonth === m.key;

                        return (
                          <div 
                            key={m.key} 
                            className="monthly-report-card"
                            style={{ 
                              border: '1px solid var(--slate-200)', 
                              borderRadius: 'var(--radius-md)', 
                              overflow: 'hidden',
                              backgroundColor: 'var(--white)'
                            }}
                          >
                            <div 
                              className="monthly-report-header"
                              onClick={() => setExpandedMonth(isExpanded ? null : m.key)}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '1rem 1.25rem', 
                                backgroundColor: isExpanded ? 'var(--indigo-50)' : 'var(--slate-50)', 
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                            >
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--slate-900)' }}>
                                  {m.label}
                                </h4>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                                  {m.count} opération(s) enregistrée(s)
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Bilan Net</div>
                                  <div className={`amount-cell ${monthBalance >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: '700' }}>
                                    {monthBalance >= 0 ? '+' : ''}{formatAmount(monthBalance)}
                                  </div>
                                </div>

                                <button className="btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                                  {isExpanded ? 'Masquer le détail' : 'Voir le détail'}
                                </button>
                              </div>
                            </div>

                            {/* Section des détails dépliables du mois */}
                            {isExpanded && (
                              <div className="monthly-details-content" style={{ padding: '1rem', borderTop: '1px solid var(--slate-200)', backgroundColor: 'var(--white)' }}>
                                <h5 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                                  Détail des opérations de {m.label} :
                                </h5>

                                <div className="table-responsive">
                                  <table className="data-table">
                                    <thead>
                                      <tr>
                                        <th>Type</th>
                                        <th>Bénéficiaire / Demandeur</th>
                                        <th>Mode / Réf</th>
                                        <th>Date</th>
                                        <th>Montant</th>
                                        <th>Reçu</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {m.items.map(item => {
                                        const isWithdrawal = item.amount < 0;
                                        return (
                                          <tr key={item.id}>
                                            <td>
                                              <span className={`badge ${isWithdrawal ? 'badge-danger' : 'badge-success'}`}>
                                                {isWithdrawal ? 'Retrait' : 'Cotisation'}
                                              </span>
                                            </td>
                                            <td>
                                              <div className="user-table-cell">
                                                <IconUser size={16} />
                                                <span><strong>{item.userName}</strong></span>
                                              </div>
                                            </td>
                                            <td>
                                              <div className="payment-method-tag">
                                                <span className="method-name">{item.paymentMethod}</span>
                                                {item.transactionRef && (
                                                  <span className="ref-code" title="N° de transaction">{item.transactionRef}</span>
                                                )}
                                              </div>
                                            </td>
                                            <td>{formatDate(item.date)}</td>
                                            <td className={`amount-cell ${isWithdrawal ? 'text-danger' : 'text-success'}`}>
                                              {isWithdrawal ? '-' : '+'}{formatAmount(Math.abs(item.amount))}
                                            </td>
                                            <td>
                                              <button 
                                                className="btn-icon" 
                                                onClick={() => setSelectedReceipt(item)}
                                                title="Imprimer le reçu de paiement"
                                              >
                                                <IconPrinter size={16} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Reçu de Paiement Imprimable */}
      {selectedReceipt && (
        <div className="modal-backdrop">
          <div className="modal-content receipt-modal-content">
            <div className="modal-header">
              <h2>Reçu Officiel de Transaction</h2>
              <button className="modal-close" onClick={() => setSelectedReceipt(null)}><IconX size={20} /></button>
            </div>

            <div className="printable-receipt" id="printableReceipt">
              <div className="receipt-brand">
                <img src="/logo.png" alt="Heleanaf Logo" className="receipt-logo-img" />
                <h3>HELEANAF ENTERPRISE</h3>
                <p>Reçu de Cotisation / Tontine Officiel</p>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-row">
                <span className="receipt-label">Référence Reçu :</span>
                <span className="receipt-value">#REC-{selectedReceipt.id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Groupe :</span>
                <span className="receipt-value">{selectedGroup?.name}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Bénéficiaire / Demandeur :</span>
                <span className="receipt-value">{selectedReceipt.userName}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Date de la transaction :</span>
                <span className="receipt-value">{formatDate(selectedReceipt.date)}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Mode de paiement :</span>
                <span className="receipt-value">{selectedReceipt.paymentMethod}</span>
              </div>

              {selectedReceipt.transactionRef && (
                <div className="receipt-row">
                  <span className="receipt-label">N° de Transaction :</span>
                  <span className="receipt-value">{selectedReceipt.transactionRef}</span>
                </div>
              )}

              <div className="receipt-divider"></div>

              <div className="receipt-total-row">
                <span>Montant versé :</span>
                <span className="receipt-total-amount">{formatAmount(Math.abs(selectedReceipt.amount))}</span>
              </div>

              <div className="receipt-footer-note">
                Document généré électroniquement par la plateforme Heleanaf.
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setSelectedReceipt(null)}>Fermer</button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => window.print()}
              >
                <IconPrinter size={16} /> Imprimer le reçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Groups;