import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbSignOut, 
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  setDoc
} from '../lib/firebase';
import { StoryUser } from '../lib/types';

interface AuthContextType {
  user: StoryUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

const AVATAR_COLORS = ['#7A9E87', '#E8A2A2', '#E8C547', '#6C8EA4', '#A084CA', '#E07A5F'];

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'SF'
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoryUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || typeof onAuthStateChanged !== 'function') {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          if (db && typeof getDoc === 'function') {
            const userRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              setUser(userDoc.data() as StoryUser);
            } else {
              const defaultProfile: StoryUser = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Storyteller',
                username: `@${fbUser.email?.split('@')[0] || 'storyteller'}`,
                avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
                initials: getInitials(fbUser.displayName || fbUser.email || 'SF'),
                bio: 'Storyteller sketching personal memories and real chapters.',
                followers: 0,
                following: 0,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userRef, defaultProfile);
              setUser(defaultProfile);
            }
          } else {
            setUser({
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Storyteller',
              username: `@${fbUser.email?.split('@')[0] || 'storyteller'}`,
              avatarColor: '#7A9E87',
              initials: getInitials(fbUser.displayName || fbUser.email || 'SF'),
              followers: 0,
              following: 0,
            });
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile:', err);
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Storyteller',
            username: `@${fbUser.email?.split('@')[0] || 'storyteller'}`,
            avatarColor: '#7A9E87',
            initials: getInitials(fbUser.displayName || fbUser.email || 'SF'),
            followers: 0,
            following: 0,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (!auth || typeof signInWithEmailAndPassword !== 'function') {
        throw new Error('Firebase Auth is not initialized. Please verify your config in .env');
      }
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;

      if (db && typeof getDoc === 'function') {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as StoryUser);
        } else {
          const profile: StoryUser = {
            id: fbUser.uid,
            name: fbUser.displayName || email.split('@')[0],
            username: `@${email.split('@')[0]}`,
            avatarColor: '#7A9E87',
            initials: getInitials(email.split('@')[0]),
            bio: 'Storyteller sketching personal memories and real chapters.',
            followers: 0,
            following: 0,
            createdAt: new Date().toISOString(),
          };
          if (db && typeof setDoc === 'function') {
            await setDoc(doc(db, 'users', fbUser.uid), profile);
          }
          setUser(profile);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      if (!auth || typeof createUserWithEmailAndPassword !== 'function') {
        throw new Error('Firebase Auth is not initialized. Please verify your config in .env');
      }
      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUser: StoryUser = {
        id: cred.user.uid,
        name: name.trim(),
        username: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        avatarColor: color,
        initials: getInitials(name),
        bio: 'Storyteller sketching personal memories and real chapters.',
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
      };

      if (db && typeof setDoc === 'function') {
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
      }
      setUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (auth && typeof fbSignOut === 'function') {
        await fbSignOut(auth);
      }
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
