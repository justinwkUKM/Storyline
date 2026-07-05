import { getAnalytics, isSupported } from 'firebase/analytics';
import { getApp, getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8IcBNm6lE7-uajA1chpT2RoLmK7fJIaY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'storyline-6cd69.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'storyline-6cd69',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'storyline-6cd69.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '101681268749',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:101681268749:web:7d39ff9b760b05b94fad44',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-S5EWQK5YBV',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
  .catch(() => null);
