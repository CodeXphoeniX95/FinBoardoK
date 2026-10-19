import { supabase } from './supabase';

// ==================== AUTHENTIFICATION ====================

export const register = async (email, password) => {
  try {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        email: data.user.email,
        full_name: cleanEmail.split('@')[0],
        currency: 'FCFA'
      }], { onConflict: 'id' });
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const login = async (email, password) => {
  try {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.email.split('@')[0],
        currency: 'FCFA'
      }], { onConflict: 'id' });
    }

    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== RECHERCHE UTILISATEURS ====================

export const searchUsers = async (searchQuery) => {
  try {
    if (!searchQuery || searchQuery.trim().length < 1) return { success: true, data: [] };
    const query = searchQuery.trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== BUDGETS ====================

export const createBudget = async (budgetData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const budget = {
      user_id: user.id,
      name: budgetData.name,
      type: budgetData.type,
      initial_amount: budgetData.initialAmount || 0,
      current_balance: budgetData.initialAmount || 0,
      is_active: true
    };

    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select()
      .single();

    if (error) throw error;
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBudgets = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const budgets = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      type: item.type,
      initialAmount: Number(item.initial_amount || 0),
      currentBalance: Number(item.current_balance || 0),
      isActive: item.is_active,
      createdAt: { toDate: () => new Date(item.created_at || Date.now()) }
    }));

    return { success: true, data: budgets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBudget = async (budgetId, updates) => {
  try {
    const dbUpdates = {};
    if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('budgets')
      .update(dbUpdates)
      .eq('id', budgetId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const { error } = await supabase
      .from('budgets')
      .update({ is_active: false })
      .eq('id', budgetId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== ACTIONS (TRANSACTIONS PERSONNELLES) ====================

export const createAction = async (actionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const rawDate = actionData.date?.toDate ? actionData.date.toDate() : new Date(actionData.date);
    const dateFormatted = rawDate.toISOString();

    const action = {
      user_id: user.id,
      budget_id: actionData.budgetId,
      type: actionData.type,
      amount: actionData.amount,
      description: actionData.description,
      category: actionData.category || 'autres',
      date: dateFormatted
    };

    const { data, error } = await supabase
      .from('actions')
      .insert([action])
      .select()
      .single();

    if (error) throw error;

    await updateBudgetBalance(actionData.budgetId, actionData.type, actionData.amount);

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getActions = async (filters = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    let queryBuilder = supabase
      .from('actions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (filters.budgetId) {
      queryBuilder = queryBuilder.eq('budget_id', filters.budgetId);
    }
    if (filters.type) {
      queryBuilder = queryBuilder.eq('type', filters.type);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;

    const actions = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      budgetId: item.budget_id,
      type: item.type,
      amount: Number(item.amount),
      description: item.description,
      category: item.category,
      date: { toDate: () => new Date(item.date || item.created_at) },
      createdAt: { toDate: () => new Date(item.created_at || Date.now()) }
    }));

    return { success: true, data: actions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAction = async (actionId) => {
  try {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', actionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== GROUPES DE COTISATION & TONTINES ====================

export const createGroup = async (groupData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const group = {
      created_by: user.id,
      name: groupData.name,
      cotisation_type: groupData.cotisationType,
      fixed_amount: groupData.fixedAmount || 0,
      members: [user.id]
    };

    const { data, error } = await supabase
      .from('groups')
      .insert([group])
      .select()
      .single();

    if (error) throw error;
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGroups = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userGroups = (data || []).filter(item => {
      const isCreator = item.created_by === user.id;
      const isMember = Array.isArray(item.members) && item.members.includes(user.id);
      return isCreator || isMember;
    });

    const groups = userGroups.map(item => ({
      id: item.id,
      createdBy: item.created_by,
      name: item.name,
      cotisationType: item.cotisation_type,
      fixedAmount: Number(item.fixed_amount || 0),
      members: item.members || [item.created_by],
      createdAt: { toDate: () => new Date(item.created_at || Date.now()) }
    }));

    return { success: true, data: groups };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addGroupMember = async (groupId, targetUserId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data: group, error: fetchErr } = await supabase
      .from('groups')
      .select('created_by, members')
      .eq('id', groupId)
      .single();

    if (fetchErr) throw fetchErr;

    if (group.created_by !== user.id) {
      throw new Error('Seul l\'administrateur du groupe est autorisé à inviter des membres.');
    }

    const currentMembers = Array.isArray(group.members) ? group.members : [];
    if (!currentMembers.includes(targetUserId)) {
      const updatedMembers = [...currentMembers, targetUserId];
      const { error: updateErr } = await supabase
        .from('groups')
        .update({ members: updatedMembers })
        .eq('id', groupId);

      if (updateErr) throw updateErr;
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGroupMembers = async (groupId) => {
  try {
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('created_by, members')
      .eq('id', groupId)
      .single();

    if (groupErr) throw groupErr;

    const memberIds = Array.isArray(group.members) ? [...group.members] : [group.created_by];
    if (!memberIds.includes(group.created_by)) memberIds.push(group.created_by);

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', memberIds);

    if (profErr) throw profErr;

    const members = (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name || p.email.split('@')[0],
      avatarUrl: p.avatar_url,
      role: p.id === group.created_by ? 'admin' : 'membre'
    }));

    return { success: true, data: members };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== COTISATIONS (POUR SOI OU POUR AUTRUI + TMONEY / FLOOZ) ====================

export const addCotisation = async (groupId, cotisationData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data: group } = await supabase
      .from('groups')
      .select('created_by, members')
      .eq('id', groupId)
      .single();

    if (group && group.created_by !== user.id) {
      throw new Error('Seul l\'administrateur du groupe est autorisé à enregistrer des cotisations.');
    }

    const targetUserId = cotisationData.forUserId || user.id;

    // S'assurer automatiquement que le bénéficiaire appartient aux membres du groupe
    if (group) {
      const currentMembers = Array.isArray(group.members) ? group.members : [group.created_by];
      if (!currentMembers.includes(targetUserId)) {
        await supabase
          .from('groups')
          .update({ members: [...currentMembers, targetUserId] })
          .eq('id', groupId);
      }
    }

    // Vérifier si TMoney ou Flooz exige un N° de transaction
    const paymentMethod = cotisationData.paymentMethod || 'CASH';
    const transactionRef = cotisationData.transactionRef?.trim() || '';

    if ((paymentMethod === 'TMONEY' || paymentMethod === 'FLOOZ') && !transactionRef) {
      throw new Error(`Le N° de transaction est obligatoire pour les paiements par ${paymentMethod}.`);
    }

    const rawDate = cotisationData.date?.toDate ? cotisationData.date.toDate() : new Date(cotisationData.date);

    const cotisation = {
      group_id: groupId,
      user_id: targetUserId, // Pour que la RLS et la requête membre trouvent la cotisation
      for_user_id: targetUserId,
      amount: Math.abs(cotisationData.amount),
      payment_method: paymentMethod,
      transaction_ref: transactionRef,
      date: rawDate.toISOString()
    };

    const { data, error } = await supabase
      .from('cotisations')
      .insert([cotisation])
      .select()
      .single();

    if (error) {
      // Fallback si colonnes pas encore étendues
      const fallbackCotisation = {
        group_id: groupId,
        user_id: targetUserId,
        amount: Math.abs(cotisationData.amount),
        date: rawDate.toISOString()
      };
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('cotisations')
        .insert([fallbackCotisation])
        .select()
        .single();

      if (fallbackErr) throw fallbackErr;
      return { success: true, id: fallbackData.id };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCotisations = async (groupId) => {
  try {
    const { data: cotisationsData, error: cotErr } = await supabase
      .from('cotisations')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    if (cotErr) throw cotErr;

    // Récupérer les profils pour afficher qui a saisi ET pour qui la cotisation est faite
    const userIds = [...new Set((cotisationsData || []).map(c => c.for_user_id || c.user_id))];
    let userProfilesMap = {};

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesData) {
        profilesData.forEach(p => {
          userProfilesMap[p.id] = p.full_name || p.email.split('@')[0];
        });
      }
    }

    const cotisations = (cotisationsData || []).map(item => {
      const beneficiaryId = item.for_user_id || item.user_id;
      return {
        id: item.id,
        groupId: item.group_id,
        userId: item.user_id,
        forUserId: beneficiaryId,
        userName: userProfilesMap[beneficiaryId] || 'Membre',
        amount: Number(item.amount),
        paymentMethod: item.payment_method || 'CASH',
        transactionRef: item.transaction_ref || '',
        date: { toDate: () => new Date(item.date || item.created_at) },
        createdAt: { toDate: () => new Date(item.created_at || Date.now()) }
      };
    });

    return { success: true, data: cotisations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== RETRAITS & CONFIRMATION MULTI-MEMBRES ====================

export const createWithdrawalRequest = async (groupId, withdrawalData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const paymentMethod = withdrawalData.paymentMethod || 'CASH';
    const transactionRef = withdrawalData.transactionRef?.trim() || '';

    if ((paymentMethod === 'TMONEY' || paymentMethod === 'FLOOZ') && !transactionRef) {
      throw new Error(`Le N° de transaction est obligatoire pour les retraits par ${paymentMethod}.`);
    }

    const rawDate = withdrawalData.date ? new Date(withdrawalData.date) : new Date();

    const request = {
      group_id: groupId,
      requested_by: user.id,
      amount: Math.abs(withdrawalData.amount),
      description: withdrawalData.description || 'Retrait de cagnotte',
      payment_method: paymentMethod,
      transaction_ref: transactionRef,
      status: 'EN_ATTENTE',
      approvals: [user.id] // L'auteur confirme automatiquement sa demande
    };

    const { data, error } = await supabase
      .from('group_withdrawals')
      .insert([request])
      .select()
      .single();

    if (error) {
      // Fallback si la table group_withdrawals n'est pas encore créée
      const fallbackWithdrawal = {
        group_id: groupId,
        user_id: user.id,
        amount: -Math.abs(withdrawalData.amount),
        date: rawDate.toISOString()
      };
      await supabase.from('cotisations').insert([fallbackWithdrawal]);
      return { success: true, fallback: true };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const approveWithdrawalRequest = async (withdrawalId, currentApprovals = [], groupTotalMembersCount = 1) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utilisateur non connecté');

    if (currentApprovals.includes(user.id)) {
      return { success: true, message: 'Vous avez déjà confirmé ce retrait.' };
    }

    const updatedApprovals = [...currentApprovals, user.id];
    // Si tous les membres ou au moins la majorité ont approuvé
    const isFullyApproved = updatedApprovals.length >= Math.ceil(groupTotalMembersCount / 2);
    const newStatus = isFullyApproved ? 'APPROUVE' : 'EN_ATTENTE';

    const { data, error } = await supabase
      .from('group_withdrawals')
      .update({
        approvals: updatedApprovals,
        status: newStatus
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (error) throw error;

    // Si le retrait est maintenant approuvé, enregistrer le mouvement négatif dans cotisations
    if (newStatus === 'APPROUVE') {
      const negativeEntry = {
        group_id: data.group_id,
        user_id: data.requested_by,
        amount: -Math.abs(data.amount),
        payment_method: data.payment_method,
        transaction_ref: data.transaction_ref,
        date: new Date().toISOString()
      };
      await supabase.from('cotisations').insert([negativeEntry]);
    }

    return { success: true, status: newStatus };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getWithdrawalRequests = async (groupId) => {
  try {
    const { data, error } = await supabase
      .from('group_withdrawals')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) return { success: true, data: [] };

    // Profiles map
    const userIds = [...new Set((data || []).map(w => w.requested_by))];
    let userProfilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach(p => {
          userProfilesMap[p.id] = p.full_name || p.email.split('@')[0];
        });
      }
    }

    const requests = (data || []).map(item => ({
      id: item.id,
      groupId: item.group_id,
      requestedBy: item.requested_by,
      requesterName: userProfilesMap[item.requested_by] || 'Membre',
      amount: Number(item.amount),
      description: item.description,
      paymentMethod: item.payment_method || 'CASH',
      transactionRef: item.transaction_ref || '',
      status: item.status || 'EN_ATTENTE',
      approvals: item.approvals || [],
      createdAt: { toDate: () => new Date(item.created_at || Date.now()) }
    }));

    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== HELPERS INTERNES ====================

const updateBudgetBalance = async (budgetId, actionType, amount) => {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('current_balance')
      .eq('id', budgetId)
      .single();

    if (error || !data) return;

    const currentBalance = Number(data.current_balance || 0);
    let newBalance = currentBalance;

    switch (actionType) {
      case 'REVENU':
        newBalance = currentBalance + amount;
        break;
      case 'DEPENSE':
        newBalance = currentBalance - amount;
        break;
      case 'EPARGNE':
        newBalance = currentBalance - amount;
        break;
      default:
        break;
    }

    await supabase
      .from('budgets')
      .update({ current_balance: newBalance })
      .eq('id', budgetId);
  } catch (err) {
    console.error('Erreur mise à jour solde:', err);
  }
};

// ==================== NOTIFICATIONS DE GROUPE ====================

export const getPendingGroupNotificationsCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: groups, error: groupErr } = await supabase
      .from('groups')
      .select('id, created_by, members');

    if (groupErr || !groups) return 0;

    const userGroupIds = groups
      .filter(g => g.created_by === user.id || (Array.isArray(g.members) && g.members.includes(user.id)))
      .map(g => g.id);

    if (userGroupIds.length === 0) return 0;

    const { data: pendingWithdrawals, error: withErr } = await supabase
      .from('withdrawal_requests')
      .select('id, approvals')
      .in('group_id', userGroupIds)
      .eq('status', 'EN_ATTENTE');

    if (withErr || !pendingWithdrawals) return 0;

    const unapprovedCount = pendingWithdrawals.filter(w => {
      const approvals = Array.isArray(w.approvals) ? w.approvals : [];
      return !approvals.includes(user.id);
    }).length;

    return unapprovedCount;
  } catch (error) {
    return 0;
  }
};

export const getGroupNotificationsList = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: groups, error: groupErr } = await supabase
      .from('groups')
      .select('id, name, created_by, members');

    if (groupErr || !groups) return [];

    const userGroups = groups.filter(g => 
      g.created_by === user.id || (Array.isArray(g.members) && g.members.includes(user.id))
    );

    const userGroupIds = userGroups.map(g => g.id);
    if (userGroupIds.length === 0) return [];

    const { data: pendingWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .in('group_id', userGroupIds)
      .eq('status', 'EN_ATTENTE');

    const notifs = [];

    if (pendingWithdrawals) {
      pendingWithdrawals.forEach(w => {
        const approvals = Array.isArray(w.approvals) ? w.approvals : [];
        if (!approvals.includes(user.id)) {
          const groupName = userGroups.find(g => g.id === w.group_id)?.name || 'Groupe';
          notifs.push({
            id: w.id,
            type: 'WITHDRAWAL_REQUEST',
            title: 'Demande de retrait à confirmer',
            message: `${w.description || 'Retrait'} de ${w.amount} FCFA par ${w.requester_name || 'un membre'} (${groupName})`,
            date: w.created_at || new Date().toISOString(),
            groupId: w.group_id
          });
        }
      });
    }

    return notifs;
  } catch (error) {
    return [];
  }
};