import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { branchService } from '../services/branchService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiPlus, FiEye, FiClock, FiCheck, FiX } from 'react-icons/fi';
import Loading from '../components/Loading';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'my-orders', 'related-orders'

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filter, orders]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Şubeleri çek
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);

      // Siparişleri çek
      // TODO: Backend endpoint hazır olduğunda açılacak
      // const ordersData = await orderService.getOrders();
      // setOrders(ordersData || []);
      
      setOrders([]); // Placeholder
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Siparişler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (filter === 'my-orders') {
      setFilteredOrders(orders.filter(order => order.fromBranchId === user?.branchId));
    } else if (filter === 'related-orders') {
      setFilteredOrders(orders.filter(order => order.toBranchId === user?.branchId));
    } else {
      setFilteredOrders(orders);
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId) return 'Bilinmeyen';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50', text: 'text-yellow-800', label: 'Bekliyor', border: 'border-yellow-300' },
      'STOCK_AVAILABLE': { bg: 'bg-gradient-to-r from-blue-100 to-blue-50', text: 'text-blue-800', label: 'Stokta Mevcut', border: 'border-blue-300' },
      'READY': { bg: 'bg-gradient-to-r from-green-100 to-green-50', text: 'text-green-800', label: 'Hazır', border: 'border-green-300' },
      'SHIPPED': { bg: 'bg-gradient-to-r from-purple-100 to-purple-50', text: 'text-purple-800', label: 'Çıktı', border: 'border-purple-300' },
      'CANCELLED': { bg: 'bg-gradient-to-r from-red-100 to-red-50', text: 'text-red-800', label: 'İptal', border: 'border-red-300' },
    };

    const config = statusConfig[status] || statusConfig['PENDING'];

    return (
      <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${config.bg} ${config.text} ${config.border} shadow-sm`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Siparişler</h1>
              <p className="text-gray-600">
                Tüm siparişleri görüntüleyin ve yönetin
              </p>
            </div>
            
            <Link to="/orders/new" className="btn-primary flex items-center justify-center">
              <FiPlus className="mr-2" />
              Yeni Sipariş
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              Tüm Siparişler
            </button>
            <button
              onClick={() => setFilter('my-orders')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'my-orders'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              Gönderdiğim Siparişler
            </button>
            <button
              onClick={() => setFilter('related-orders')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'related-orders'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              Bana Gelen Siparişler
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="card">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiShoppingCart className="mx-auto text-5xl mb-4 opacity-50" />
              <p className="text-lg">Henüz sipariş bulunmuyor</p>
              <Link to="/orders/new" className="btn-primary inline-flex items-center mt-4">
                <FiPlus className="mr-2" />
                İlk Siparişinizi Oluşturun
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sipariş No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Gönderen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Alıcı
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.orderNumber || order.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getBranchName(order.fromBranchId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getBranchName(order.toBranchId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEye className="inline mr-1" />
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;

