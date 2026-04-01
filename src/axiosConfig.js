import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
