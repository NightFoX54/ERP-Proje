import api from '../utils/api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  register: async (username, password, branchId) => {
    const response = await api.post('/api/auth/register', { username, password, branchId });
    return response.data;
  },

  getAccounts: async () => {
    const response = await api.get('/api/auth/branches');
    return response.data;
  },

  deleteAccount: async (id) => {
    await api.delete(`/api/auth/accounts/${id}`);
  },
};

