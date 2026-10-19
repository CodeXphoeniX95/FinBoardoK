import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[`VITE_${key}`] || import.meta.env[`REACT_APP_${key}`] || import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`REACT_APP_${key}`] || process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY') || 'demo-api-key',
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || 'demo-app.firebaseapp.com',
  projectId: getEnvVar('FIREBASE_PROJECT_ID') || 'demo-app',
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || 'demo-app.appspot.com',
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || '123456789',
  appId: getEnvVar('FIREBASE_APP_ID') || '1:123456789:web:abcdef'
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Auth et Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Activer le mode hors ligne
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Plusieurs onglets ouverts, persistance désactivée');
    } else if (err.code === 'unimplemented') {
      console.warn('Navigateur non supporté pour le mode hors ligne');
    }
  });