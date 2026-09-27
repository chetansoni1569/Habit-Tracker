import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { createUserProfile, getUserProfile, createDefaultHabits } from '../services/firestore';
import type { UserProfile, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: AuthUser = {
  uid: 'demo-user',
  email: 'demo@habittracker.app',
  displayName: 'Alex Morgan',
  photoURL: '',
  isAnonymous: true,
};

const CURRENT_USER_KEY = 'habit_tracker_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const authUser: AuthUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                isAnonymous: firebaseUser.isAnonymous,
              };
              setUser(authUser);

              try {
                const p = await getUserProfile(firebaseUser.uid);
                setProfile(
                  p || {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                    email: firebaseUser.email || '',
                    username: firebaseUser.email?.split('@')[0] || 'user',
                    photoURL: firebaseUser.photoURL || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                );
              } catch (profileErr) {
                console.warn('Could not read user profile from Firestore:', profileErr);
                setProfile({
                  uid: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  username: firebaseUser.email?.split('@')[0] || 'user',
                  photoURL: firebaseUser.photoURL || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            } else {
              setUser(null);
              setProfile(null);
            }
          } catch (err) {
            console.error('Error in onAuthStateChanged handler:', err);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('onAuthStateChanged subscription error:', error);
          setLoading(false);
        }
      );
      return unsubscribe;
    } else {
      // Offline / Local / Demo mode: check local session or default to demo user
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        try {
          const parsed: AuthUser = JSON.parse(stored);
          setUser(parsed);
          getUserProfile(parsed.uid).then((p) => {
            if (p) setProfile(p);
            setLoading(false);
          }).catch(() => setLoading(false));
          return;
        } catch {
          // fall through
        }
      }

      // Default to Demo user so user can open browser and immediately see the app!
      loginAsGuest().finally(() => setLoading(false));
    }
  }, []);

  const loginAsGuest = async () => {
    setLoading(true);
    const guestUser = DEMO_USER;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(guestUser));
    setUser(guestUser);

    let p = await getUserProfile(guestUser.uid);
    if (!p) {
      await createUserProfile(guestUser.uid, {
        name: guestUser.displayName || 'Demo User',
        email: guestUser.email || 'demo@habittracker.app',
      });
      await createDefaultHabits(guestUser.uid);
      p = await getUserProfile(guestUser.uid);
    }
    setProfile(p);
    setLoading(false);
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        isAnonymous: result.user.isAnonymous,
      };
      setUser(authUser);
      try {
        const p = await getUserProfile(result.user.uid);
        setProfile(
          p || {
            uid: result.user.uid,
            name: result.user.displayName || email.split('@')[0],
            email: result.user.email || email,
            username: email.split('@')[0],
            photoURL: result.user.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (err) {
        console.warn('Could not read user profile from Firestore:', err);
      }
    } else {
      // Local fallback auth
      const localUid = `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const localUser: AuthUser = {
        uid: localUid,
        email,
        displayName: email.split('@')[0],
        photoURL: '',
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUser));
      setUser(localUser);

      let p = await getUserProfile(localUid);
      if (!p) {
        await createUserProfile(localUid, { name: email.split('@')[0], email });
        await createDefaultHabits(localUid);
        p = await getUserProfile(localUid);
      }
      setProfile(p);
    }
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await updateProfile(result.user, { displayName: name });
      } catch (e) {
        console.warn('Could not update auth display name:', e);
      }
      try {
        await createUserProfile(result.user.uid, { name, email });
        await createDefaultHabits(result.user.uid);
      } catch (e) {
        console.warn('Could not create Firestore user profile or default habits:', e);
      }
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name,
        photoURL: result.user.photoURL,
      };
      setUser(authUser);
      setProfile({
        uid: result.user.uid,
        name,
        email,
        username: email.split('@')[0],
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Local fallback registration
      const localUid = `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const localUser: AuthUser = {
        uid: localUid,
        email,
        displayName: name,
        photoURL: '',
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(localUser));
      setUser(localUser);

      await createUserProfile(localUid, { name, email });
      await createDefaultHabits(localUid);
      const p = await getUserProfile(localUid);
      setProfile(p);
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const result = await signInWithPopup(auth, googleProvider);
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
      setUser(authUser);

      try {
        let p = await getUserProfile(result.user.uid);
        if (!p) {
          await createUserProfile(result.user.uid, {
            name: result.user.displayName || 'Google User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || '',
          });
          await createDefaultHabits(result.user.uid);
          p = await getUserProfile(result.user.uid);
        }
        setProfile(
          p || {
            uid: result.user.uid,
            name: result.user.displayName || 'Google User',
            email: result.user.email || '',
            username: result.user.email?.split('@')[0] || 'google_user',
            photoURL: result.user.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (e) {
        console.warn('Could not read or create Google user profile in Firestore:', e);
        setProfile({
          uid: result.user.uid,
          name: result.user.displayName || 'Google User',
          email: result.user.email || '',
          username: result.user.email?.split('@')[0] || 'google_user',
          photoURL: result.user.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      // Simulated Google sign in
      const googleUid = 'google_demo_user';
      const googleUser: AuthUser = {
        uid: googleUid,
        email: 'alex.morgan@gmail.com',
        displayName: 'Alex Morgan',
        photoURL: '',
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser));
      setUser(googleUser);

      let p = await getUserProfile(googleUid);
      if (!p) {
        await createUserProfile(googleUid, {
          name: 'Alex Morgan',
          email: 'alex.morgan@gmail.com',
        });
        await createDefaultHabits(googleUid);
        p = await getUserProfile(googleUid);
      }
      setProfile(p);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // In local mode, simulate success
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsGuest,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
