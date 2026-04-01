import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../axiosConfig';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: Re-enable Firebase auth once domain is configured
  const [token, setToken] = useState('dev-bypass-token');
  const [user, setUser] = useState({
    id: 'dev-user',
    email: 'dev@buildboard.local',
    name: 'Dev User',
    pictureUrl: null,
    role: 'Admin',
  });
  const [loading, setLoading] = useState(false);

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
