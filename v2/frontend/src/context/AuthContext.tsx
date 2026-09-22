import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = 'chronicle_v2_auth_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  logOut: async () => {},
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore session from localStorage if available
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to restore auth session', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      // Simulate real Google authentication profile with Sathiyamoorthi K identity
      const googleUser: UserProfile = {
        uid: 'usr_google_79841289',
        email: 'kkssathiyamoorthi@gmail.com',
        displayName: 'Sathiyamoorthi K (Ksmashhero)',
        photoURL: null,
        isAnonymous: false,
      };
      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async () => {
    try {
      setError(null);
      setLoading(true);
      const guestUser: UserProfile = {
        uid: `guest_${Date.now().toString(36)}`,
        email: 'demo-judge@aws-zero-to-shipped.community',
        displayName: 'AWS Competition Judge',
        photoURL: null,
        isAnonymous: true,
      };
      setUser(guestUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestUser));
    } catch (err: any) {
      setError(err?.message || 'Guest sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setError(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err: any) {
      setError(err?.message || 'Sign out failed.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signInAsGuest,
        logOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
