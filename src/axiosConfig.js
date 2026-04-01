import axios from 'axios';

const api = axios.create({
  baseURL: 'https://build-board-backend.vercel.app/api',
});

let getToken = () => null;

export function setTokenGetter(fn) {
  getToken = fn;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
