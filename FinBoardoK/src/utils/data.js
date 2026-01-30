import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ==================== AUTHENTIFICATION ====================

export const register = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== BUDGETS ====================

export const createBudget = async (budgetData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const budget = {
      ...budgetData,
      userId,
      currentBalance: budgetData.initialAmount || 0,
      isActive: true,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'budgets'), budget);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getBudgets = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const q = query(
      collection(db, 'budgets'), 
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const budgets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: budgets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBudget = async (budgetId, updates) => {
  try {
    const budgetRef = doc(db, 'budgets', budgetId);
    await updateDoc(budgetRef, updates);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const budgetRef = doc(db, 'budgets', budgetId);
    await updateDoc(budgetRef, { isActive: false });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== ACTIONS ====================

export const createAction = async (actionData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const action = {
      ...actionData,
      userId,
      createdAt: Timestamp.now()
    };

    // Ajouter l'action
    const docRef = await addDoc(collection(db, 'actions'), action);

    // Mettre à jour le solde du budget
    await updateBudgetBalance(actionData.budgetId, actionData.type, actionData.amount);

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getActions = async (filters = {}) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    let q = query(
      collection(db, 'actions'), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    // Appliquer les filtres si nécessaire
    if (filters.budgetId) {
      q = query(q, where('budgetId', '==', filters.budgetId));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }

    const snapshot = await getDocs(q);
    const actions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: actions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteAction = async (actionId) => {
  try {
    const actionRef = doc(db, 'actions', actionId);
    await deleteDoc(actionRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== GROUPES ====================

export const createGroup = async (groupData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const group = {
      ...groupData,
      createdBy: userId,
      members: [userId],
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'groups'), group);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGroups = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const q = query(
      collection(db, 'groups'), 
      where('members', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: groups };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addCotisation = async (groupId, cotisationData) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Utilisateur non connecté');

    const cotisation = {
      ...cotisationData,
      groupId,
      userId,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'cotisations'), cotisation);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getCotisations = async (groupId) => {
  try {
    const q = query(
      collection(db, 'cotisations'), 
      where('groupId', '==', groupId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const cotisations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { success: true, data: cotisations };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== HELPERS ====================

const updateBudgetBalance = async (budgetId, actionType, amount) => {
  try {
    const budgetRef = doc(db, 'budgets', budgetId);
    const budgetSnap = await getDocs(query(collection(db, 'budgets'), where('__name__', '==', budgetId)));
    
    if (!budgetSnap.empty) {
      const currentBalance = budgetSnap.docs[0].data().currentBalance || 0;
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

      await updateDoc(budgetRef, { currentBalance: newBalance });
    }
  } catch (error) {
    console.error('Erreur mise à jour balance:', error);
  }
};