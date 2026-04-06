import axios from 'axios';

export const getBaseURL = () => {
  // En desarrollo local, usamos el mismo hostname pero puerto 8000
  const hostname = window.location.hostname;
  return `http://${hostname}:8000`;
};

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getBaseURL()}/storage/${path}`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to handle dynamic tenant domain if needed
api.interceptors.request.use((config) => {
  const tenant = localStorage.getItem('active_tenant');
  if (tenant) {
    // If using headers for tenancy instead of subdomains
    config.headers['X-Tenant'] = tenant;
    
    // If using subdomains, you'd usually have the baseURL already pointing to the subdomain
    // But for local dev with localhost:8000, we might use a header or proxy
  }
  
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeBranch = localStorage.getItem('active_branch');
  if (activeBranch) {
    try {
      const branch = JSON.parse(activeBranch);
      if (branch && branch.id) {
        config.headers['X-Branch-Id'] = branch.id;
        config.headers['X-Sucursal-Id'] = branch.id;
      }
    } catch (e) {
      console.error("Error parsing active_branch", e);
    }
  }
  
  return config;
});

export default api;
