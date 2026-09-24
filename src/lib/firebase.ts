import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId,
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const isFirebaseConfigured = Boolean(
  firebaseConfigData.projectId &&
  !firebaseConfigData.projectId.includes('YOUR_') &&
  !firebaseConfigData.projectId.includes('placeholder') &&
  firebaseConfigData.apiKey &&
  !firebaseConfigData.apiKey.includes('YOUR_')
);

// Auth instance
export const auth = getAuth(app);

// Firestore instance with robust local persistence cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfigData.firestoreDatabaseId);

// Storage instance
export const storage = getStorage(app);

export default app;

