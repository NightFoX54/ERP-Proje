import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Şubeleri çek
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);

      // İstatistikleri çek (şimdilik placeholder, backend'den gelecek)
      // TODO: Backend'den sipariş istatistikleri endpoint'i eklendiğinde güncellenecek
      
      setLoading(false);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen Şube';
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
        {/* Welcome Section */}
        <div className="card bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white shadow-strong border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Hoş Geldiniz, {user?.username}</h1>
            <p className="text-white/90 font-medium">
              {isAdmin() 
                ? 'Admin panelinden tüm işlemleri yönetebilirsiniz'
                : `${getBranchName(user?.branchId)} şubesi için işlemlerinizi gerçekleştirebilirsiniz`
              }
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Ürün</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl shadow-md">
                <FiPackage className="text-2xl text-primary-700" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Sipariş</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl shadow-md">
                <FiShoppingCart className="text-2xl text-green-700" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 font-medium">Bekleyen Siparişler</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl shadow-md">
                <FiAlertCircle className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/stock" className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border-2 border-transparent hover:border-primary-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <FiPackage className="text-3xl text-primary-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">Stok Yönetimi</h3>
                <p className="text-sm text-gray-600">
                  Ürünleri görüntüleyin, ekleyin ve düzenleyin
                </p>
              </div>
            </div>
          </Link>

          <Link to="/orders" className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group border-2 border-transparent hover:border-green-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300">
                <FiShoppingCart className="text-3xl text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">Siparişler</h3>
                <p className="text-sm text-gray-600">
                  Siparişlerinizi görüntüleyin ve yönetin
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity - Placeholder */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Son Aktiviteler</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Henüz aktivite bulunmuyor</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

