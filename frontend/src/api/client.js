import axios from 'axios';

// Empty baseURL so all requests go to the same host/port the page was loaded from.
// In Docker: nginx proxies /api/* → backend:8000
// In local dev (npm run dev): set VITE_API_URL=http://localhost:8000 in frontend/.env.local
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
