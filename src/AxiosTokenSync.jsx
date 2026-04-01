import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { setTokenGetter } from './axiosConfig';

export function AxiosTokenSync() {
  const { token } = useAuth();

  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  return null;
}
