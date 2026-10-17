import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyDN5rmaIBSWLRDZljpLeZlRaRJTHvX8orc',
  authDomain: 'pickleball-593eb.firebaseapp.com',
  projectId: 'pickleball-593eb',
  storageBucket: 'pickleball-593eb.firebasestorage.app',
  messagingSenderId: '970135150381',
  appId: '1:970135150381:web:5c2dd6d4b9e1e13e4b7da4',
  measurementId: 'G-6BKK2SLXG0',
};

// customer app uses its own named Firebase instance so its login session never mixes with the other app.
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
isSupported().then((ok) => ok && getAnalytics(app)).catch(() => {});