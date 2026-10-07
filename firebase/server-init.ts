import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface ServerFirebaseSDKs {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// This function is safe to call on the server.
export function initializeFirebaseOnServer(): ServerFirebaseSDKs {
  if (getApps().length === 0) {
    const app = initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }
  const app = getApp();
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}
