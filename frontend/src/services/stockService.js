import api from '../utils/api';

export const stockService = {
  getProducts: async () => {
    const response = await api.get('/api/stock');
    return response.data;
  },

  createProduct: async (product) => {
    const response = await api.post('/api/stock', product);
    return response.data;
  },

  updateProduct: async (id, product) => {
    const response = await api.put(`/api/stock/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id) => {
    await api.delete(`/api/stock/${id}`);
  },

  getProductCategories: async (branchId) => {
    const response = await api.get(`/api/stock/product-categories/${branchId}/branch`);
    return response.data;
  },

  getProductCategoryById: async (id) => {
    const response = await api.get(`/api/stock/product-categories/${id}`);
    return response.data;
  },

  createProductCategory: async (productCategory) => {
    const response = await api.post('/api/stock/product-categories', productCategory);
    return response.data;
  },

  getProductTypes: async () => {
    const response = await api.get('/api/stock/product-types');
    return response.data;
  },
};

