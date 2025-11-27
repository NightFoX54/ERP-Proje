import api from '../utils/api';

export const branchService = {
  getBranches: async () => {
    const response = await api.get('/api/branches');
    return response.data;
  },

  createBranch: async (name, isStockEnabled) => {
    const response = await api.post('/api/branches', { name, isStockEnabled });
    return response.data;
  },

  deleteBranch: async (id) => {
    await api.delete(`/api/branches/${id}`);
  },

  updateBranchStockEnabled: async (id, isStockEnabled) => {
    await api.put(`/api/branches/${id}/stock-enabled`, isStockEnabled);
  },
};

