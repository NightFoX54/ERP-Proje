import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { branchService } from '../services/branchService';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX, FiClock } from 'react-icons/fi';
import Loading from '../components/Loading';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);

      // TODO: Backend endpoint hazır olduğunda açılacak
      // const orderData = await orderService.getOrderById(id);
      // setOrder(orderData);
      
      setOrder(null); // Placeholder
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Sipariş detayları yüklenirken bir hata oluştu');
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
    // Örnek durum adımları - backend'den gelecek gerçek durumlar kullanılacak
    const steps = [
      { key: 'PENDING', label: 'Sipariş Oluşturuldu', icon: FiClock, color: 'gray' },
      { key: 'STOCK_AVAILABLE', label: 'Stokta Mevcut', icon: FiCheck, color: 'yellow' },
      { key: 'READY', label: 'Hazır', icon: FiCheck, color: 'green' },
      { key: 'SHIPPED', label: 'Çıktı', icon: FiCheck, color: 'purple' },
    ];

    if (!order) return steps;

    const currentStatus = order.status;
    const statusOrder = ['PENDING', 'STOCK_AVAILABLE', 'READY', 'SHIPPED', 'CANCELLED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      let status = 'pending'; // gray
      if (currentStatus === 'CANCELLED') {
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
    return order.toBranchId === user?.branchId;
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
                Sipariş #{order.orderNumber || id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Gönderen: {getBranchName(order.fromBranchId)} → Alıcı: {getBranchName(order.toBranchId)}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productName || 'Ürün'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg font-semibold">{item.quantity}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unitPrice?.toFixed(2) || '0.00'} ₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-700">
                      {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        {canApprove() && order.status !== 'CANCELLED' && (
          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-2 border-yellow-300 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Onay İşlemleri</h3>
            <div className="flex flex-wrap gap-3">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusUpdate('STOCK_AVAILABLE')}
                  disabled={updating}
                  className="btn-primary flex items-center"
                >
                  <FiCheck className="mr-2" />
                  Stokta Mevcut Onayı
                </button>
              )}
              {order.status === 'STOCK_AVAILABLE' && (
                <button
                  onClick={() => handleStatusUpdate('READY')}
                  disabled={updating}
                  className="btn-primary flex items-center bg-green-500 hover:bg-green-600"
                >
                  <FiCheck className="mr-2" />
                  Hazır Onayı
                </button>
              )}
              {order.status === 'READY' && (
                <button
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  disabled={updating}
                  className="btn-primary flex items-center bg-purple-500 hover:bg-purple-600"
                >
                  <FiCheck className="mr-2" />
                  Çıktı Onayı
                </button>
              )}
              {order.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusUpdate('CANCELLED')}
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

