import api from '../utils/api';

// TODO: Backend'den sipariş endpoint'leri eklendiğinde bu servis güncellenecek

export const orderService = {
  // Tüm siparişleri çek
  getOrders: async () => {
    const response = await api.get('/api/orders');
    return response.data;
  },

  // Belirli bir siparişi çek
  getOrderById: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    console.log(response.data);
    return response.data;
  },

  // Yeni sipariş oluştur
  createOrder: async (order) => {
    const response = await api.post('/api/orders', order);
    return response.data;
  },

  // Sipariş durumu güncelle (onay işlemleri)
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/api/orders/${id}/status`, {status});
    return response.data;
  },

  // Sipariş kesim bilgilerini güncelle
  updateOrderCutting: async (id, cuttingData) => {
    const response = await api.post(`/api/orders/${id}/cutting`, cuttingData);
    return response.data;
  },

  // Sepet işlemleri (localStorage üzerinden yönetilebilir)
  addToCart: (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  getCart: () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : null;
  },

  clearCart: () => {
    localStorage.removeItem('cart');
  },
};

