import api from '../utils/api';

export const statisticsService = {
  // Satın alınan ürünler arasındaki istatistikleri çek
  getPurchasedProductsBetweenDates: async (startDate, endDate) => {
    const response = await api.post('/api/statistics/purchased-products-between-dates', {
      startDate,
      endDate,
    });
    return response.data;
  },

  // Satın alınan ürünler toplam istatistiklerini çek
  getPurchasedProductsTotal: async (startDate, endDate) => {
    const response = await api.post('/api/statistics/purchased-products-between-dates/total', {
      startDate,
      endDate,
    });
    return response.data;
  },

  // Satılan ürünler arasındaki istatistikleri çek
  getSoldProductsBetweenDates: async (startDate, endDate) => {
    const response = await api.post('/api/statistics/sold-products-between-dates', {
      startDate,
      endDate,
    });
    return response.data;
  },

  // Satılan ürünler toplam istatistiklerini çek
  getSoldProductsTotal: async (startDate, endDate) => {
    const response = await api.post('/api/statistics/sold-products-between-dates/total', {
      startDate,
      endDate,
    });
    return response.data;
  },
};
