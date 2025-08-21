import axios from 'axios';
/**
 * Enhanced API service with token refresh, shortlist & enrichment support
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshing = false; let pending = [];
api.interceptors.response.use(
  (r)=>r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return Promise.reject(error);
      original._retry = true;
      if (refreshing) {
        return new Promise((resolve,reject)=> pending.push({resolve,reject})).then(()=> api(original));
      }
      refreshing = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        if (res.data?.success) {
          localStorage.setItem('token', res.data.data.token);
          pending.forEach(p=>p.resolve()); pending = [];
          return api(original);
        }
      } catch (e) {
        pending.forEach(p=>p.reject(e)); pending = [];
        localStorage.removeItem('token'); localStorage.removeItem('refreshToken');
      } finally { refreshing = false; }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.data?.refreshToken) localStorage.setItem('refreshToken', res.data.data.refreshToken);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.data?.refreshToken) localStorage.setItem('refreshToken', res.data.data.refreshToken);
    return res.data;
  },
  getProfile: async () => (await api.get('/auth/me')).data,
  updateProfile: async (profileData) => (await api.put('/auth/me/profile', { profile: profileData })).data
};

export const recommendService = {
  getRecommendations: async (profile) => (await api.post('/recommend', { profile })).data,
  previewRecommendations: async (profile) => (await api.post('/recommend/preview', { profile })).data
};

export const universityService = {
  getUniversities: async (params={}) => (await api.get('/universities', { params })).data,
  getUniversityById: async (id) => (await api.get(`/universities/${id}`)).data
};

export const chatService = {
  sendMessage: async (message, context = {}, history = []) => (await api.post('/chat', { message, context, history })).data
};

export const shortlistService = {
  getShortlist: async () => (await api.get('/shortlist')).data,
  add: async (universityId, matchScore) => (await api.post('/shortlist', { universityId, matchScore })).data,
  remove: async (id) => (await api.delete(`/shortlist/${id}`)).data
};

export const enrichService = {
  enrich: async (country, field, budget) => (await api.get('/enrich', { params: { country, field, budget } })).data
};

export default { auth: authService, recommend: recommendService, university: universityService, chat: chatService, shortlist: shortlistService, enrich: enrichService };
