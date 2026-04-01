import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../axiosConfig';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase auth state on mount / token refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        setUser((prev) =>
          prev ?? {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            pictureUrl: firebaseUser.photoURL,
            role: 'Employee',
          },
        );
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, login, logout, loading, isAuthenticated: !!token }),
    [token, user, login, logout, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
