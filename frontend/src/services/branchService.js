import api from '../utils/api';

export const branchService = {
  getBranches: async () => {
    const response = await api.get('/api/branches');
    return response.data;
  },

  createBranch: async (name) => {
    const response = await api.post('/api/branches', { name });
    return response.data;
  },

  deleteBranch: async (id) => {
    await api.delete(`/api/branches/${id}`);
  },
};

