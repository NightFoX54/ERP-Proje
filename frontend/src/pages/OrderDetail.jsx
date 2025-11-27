import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX, FiClock } from 'react-icons/fi';
import Loading from '../components/Loading';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState({}); // categoryId -> categoryName map
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[OrderDetail] Fetching order with id:', id);
      
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);
      console.log('[OrderDetail] Branches loaded:', branchesData);

      const orderData = await orderService.getOrderById(id);
      console.log('[OrderDetail] Order data received:', orderData);
      
      if (!orderData) {
        console.warn('[OrderDetail] Order not found for id:', id);
        toast.error('Sipariş bulunamadı');
        setLoading(false);
        return;
      }
      
      setOrder(orderData);
      
      // OrderItems'daki tüm unique categoryId'leri topla
      const categoryIds = [...new Set(
        (orderData.orderItems || [])
          .map(item => item.productCategoryId)
          .filter(id => id)
      )];
      
      console.log('[OrderDetail] Category IDs to fetch:', categoryIds);
      
      // Kategorileri paralel olarak çek
      if (categoryIds.length > 0) {
        try {
          const categoryPromises = categoryIds.map(categoryId => 
            stockService.getProductCategoryById(categoryId)
              .then(data => ({ id: categoryId, name: data?.productCategories?.name || 'Bilinmeyen' }))
              .catch(error => {
                console.error(`[OrderDetail] Error fetching category ${categoryId}:`, error);
                return { id: categoryId, name: 'Bilinmeyen' };
              })
          );
          
          const categoryResults = await Promise.all(categoryPromises);
          const categoryMap = {};
          categoryResults.forEach(({ id, name }) => {
            categoryMap[id] = name;
          });
          
          console.log('[OrderDetail] Categories loaded:', categoryMap);
          setCategories(categoryMap);
        } catch (error) {
          console.error('[OrderDetail] Error fetching categories:', error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[OrderDetail] Error fetching order details:', error);
      console.error('[OrderDetail] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Sipariş detayları yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId) return 'Bilinmeyen';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen';
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm('Bu işlemi gerçekleştirmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateOrderStatus(id, newStatus, user?.branchId);
      toast.success('Sipariş durumu güncellendi');
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusSteps = () => {
    // Backend'deki OrderStatus enum'una göre adımlar
    const steps = [
      { key: 'Oluşturuldu', label: 'Sipariş Oluşturuldu', icon: FiClock, color: 'gray' },
      { key: 'Onaylandı', label: 'Onaylandı', icon: FiCheck, color: 'yellow' },
      { key: 'Hazır', label: 'Hazır', icon: FiCheck, color: 'green' },
      { key: 'Çıktı', label: 'Çıktı', icon: FiCheck, color: 'purple' },
    ];

    if (!order) return steps;

    const currentStatus = order.orderStatus;
    const statusOrder = ['Oluşturuldu', 'Onaylandı', 'Hazır', 'Çıktı', 'İptal_Edildi'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      let status = 'pending'; // gray
      if (currentStatus === 'İptal_Edildi') {
        status = 'cancelled'; // red
      } else if (index < currentIndex) {
        status = 'completed'; // green
      } else if (index === currentIndex) {
        status = 'active'; // yellow
      }

      return { ...step, status };
    });
  };

  const canApprove = () => {
    if (!order) return false;
    return order.orderDeliveryBranchId === user?.branchId;
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="card text-center py-12">
          <p className="text-gray-500">Sipariş bulunamadı</p>
          <button onClick={() => navigate('/orders')} className="btn-primary mt-4">
            Siparişlere Dön
          </button>
        </div>
      </Layout>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Siparişlere Dön
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sipariş #{id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Müşteri: {order.customerName || 'Bilinmeyen'}
              </p>
              <p className="text-gray-600">
                Gönderen: {getBranchName(order.orderGivenBranchId)} → Alıcı: {getBranchName(order.orderDeliveryBranchId)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sipariş Durumu</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 md:space-x-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const colors = {
                completed: { 
                  bg: 'bg-gradient-to-br from-green-500 to-green-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-green-500/30',
                  ring: 'ring-4 ring-green-100'
                },
                active: { 
                  bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-yellow-500/30 animate-pulse',
                  ring: 'ring-4 ring-yellow-100'
                },
                pending: { 
                  bg: 'bg-gray-200', 
                  text: 'text-gray-500',
                  shadow: '',
                  ring: ''
                },
                cancelled: { 
                  bg: 'bg-gradient-to-br from-red-500 to-red-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-red-500/30',
                  ring: 'ring-4 ring-red-100'
                },
              };
              
              const color = colors[step.status] || colors.pending;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${color.bg} ${color.text} ${color.shadow} ${color.ring} mb-3 transition-all duration-300`}
                    >
                      <Icon className="text-2xl" />
                    </div>
                    <p className={`text-xs text-center font-semibold ${
                      step.status === 'completed' || step.status === 'active' 
                        ? 'text-gray-900' 
                        : 'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`hidden md:block flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-500 to-gray-300' 
                        : step.status === 'active'
                        ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-gray-300'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sipariş Detayları</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Miktar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {order.orderItems?.length > 0 ? (
                  order.orderItems.map((item, index) => {
                    // OrderItem'dan bilgileri çıkar
                    const diameter = item.diameter || '-';
                    const length = item.length ? `${item.length}mm` : '';
                    const weight = item.weight ? `${item.weight}kg` : '';
                    const quantity = item.quantity || 0;
                    const categoryName = categories[item.productCategoryId] || 'Bilinmeyen';
                    
                    return (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <p className="font-bold text-primary-700 mb-1">{categoryName}</p>
                            <p className="font-semibold">Çap: {diameter}mm</p>
                            {length && <p className="text-xs text-gray-500">Uzunluk: {length}</p>}
                            {weight && <p className="text-xs text-gray-500">Ağırlık: {weight}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg font-semibold">{quantity}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                      Siparişte ürün bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Total Price */}
          {order.totalPrice && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Fiyat:</span>
              <span className="text-xl font-bold text-primary-700">
                {order.totalPrice.toFixed(2)} ₺
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {canApprove() && order.orderStatus !== 'İptal_Edildi' && (
          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-2 border-yellow-300 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Onay İşlemleri</h3>
            <div className="flex flex-wrap gap-3">
              {order.orderStatus === 'Oluşturuldu' && (
                <button
                  onClick={() => handleStatusUpdate('Onaylandı')}
                  disabled={updating}
                  className="btn-primary flex items-center"
                >
                  <FiCheck className="mr-2" />
                  Onayla
                </button>
              )}
              {order.orderStatus === 'Onaylandı' && (
                <button
                  onClick={() => handleStatusUpdate('Hazır')}
                  disabled={updating}
                  className="btn-primary flex items-center bg-green-500 hover:bg-green-600"
                >
                  <FiCheck className="mr-2" />
                  Hazır Onayı
                </button>
              )}
              {order.orderStatus === 'Hazır' && (
                <button
                  onClick={() => handleStatusUpdate('Çıktı')}
                  disabled={updating}
                  className="btn-primary flex items-center bg-purple-500 hover:bg-purple-600"
                >
                  <FiCheck className="mr-2" />
                  Çıktı Onayı
                </button>
              )}
              {order.orderStatus === 'Oluşturuldu' && (
                <button
                  onClick={() => handleStatusUpdate('İptal_Edildi')}
                  disabled={updating}
                  className="btn-danger flex items-center"
                >
                  <FiX className="mr-2" />
                  İptal Et
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;

