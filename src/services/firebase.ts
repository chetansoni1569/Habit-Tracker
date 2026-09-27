import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID;

// Only configure Firebase if genuine credentials are provided
export const isFirebaseConfigured = Boolean(
  apiKey &&
  projectId &&
  typeof apiKey === 'string' &&
  apiKey.length > 10 &&
  apiKey !== 'your-api-key' &&
  !apiKey.startsWith('AIzaSyDummy')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId,
      storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env?.VITE_FIREBASE_APP_ID || '',
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Initialize Firestore with robust multi-tab persistent cache
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Fallback if already initialized or persistent cache not supported in environment
      db = getFirestore(app);
    }

    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization failed, falling back to local storage:', err);
  }
}

export { app, auth, db, googleProvider };
export default app;
