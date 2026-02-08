import api from '../utils/api';

export const inventoryMetricsService = {
  getAll: async () => {
    const response = await api.get('/api/inventory-metrics');
    return response.data;
  },

  calculateAll: async () => {
    await api.post('/api/inventory-metrics/calculate-all');
  },

  initialize: async () => {
    await api.post('/api/inventory-metrics/initialize');
  },

  calculateDemand: async () => {
    await api.post('/api/inventory-metrics/calculate-demand');
  },
};

export const inventoryConfigService = {
  get: async () => {
    const response = await api.get('/api/inventory-config');
    return response.data;
  },

  update: async (id, config) => {
    const response = await api.put(`/api/inventory-config/${id}`, config);
    return response.data;
  },
};
