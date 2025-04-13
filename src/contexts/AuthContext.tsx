import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface GuestUser {
  isGuest: true;
  displayName: string;
  uid: string;
}

interface AuthContextType {
  currentUser: User | GuestUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  guestLogin: (name: string) => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email: string, password: string) {
    setIsGuest(false);
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setIsGuest(false);
    setCurrentUser(null);
    return signOut(auth);
  }

  function guestLogin(name: string) {
    setIsGuest(true);
    setCurrentUser({
      isGuest: true,
      displayName: name,
      uid: `guest_${Date.now()}`
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isGuest) {
        setCurrentUser(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isGuest]);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    guestLogin,
    isGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
