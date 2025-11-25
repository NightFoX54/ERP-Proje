import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { branchService } from '../services/branchService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiEdit2, FiUsers, FiMapPin } from 'react-icons/fi';
import Loading from '../components/Loading';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' or 'users'
  
  // Branches state
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', isStockEnabled: true });
  const [loadingBranches, setLoadingBranches] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', branchId: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (activeTab === 'branches') {
      fetchBranches();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      console.log('[AdminPanel] Fetching branches...');
      const data = await branchService.getBranches();
      console.log('[AdminPanel] Branches received:', data);
      setBranches(data || []);
      
      if (!data || data.length === 0) {
        console.log('[AdminPanel] No branches found');
      }
    } catch (error) {
      console.error('[AdminPanel] Error fetching branches:', error);
      console.error('[AdminPanel] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 403) {
        toast.error('Bu işlem için admin yetkisi gereklidir');
      } else {
        toast.error('Şubeler yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await authService.getAccounts();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await branchService.createBranch(branchForm.name);
      toast.success('Şube başarıyla oluşturuldu');
      setShowBranchModal(false);
      setBranchForm({ name: '', isStockEnabled: true });
      fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Şube oluşturulurken bir hata oluştu');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Bu şubeyi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await branchService.deleteBranch(id);
      toast.success('Şube başarıyla silindi');
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Şube silinirken bir hata oluştu');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!userForm.username || !userForm.password || !userForm.branchId) {
      toast.error('Lütfen tüm alanları doldurunuz');
      return;
    }

    try {
      await authService.register(userForm.username, userForm.password, userForm.branchId);
      toast.success('Kullanıcı başarıyla oluşturuldu');
      setShowUserModal(false);
      setUserForm({ username: '', password: '', branchId: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu');
    }
  };

  const getBranchName = (branchId) => {
    if (branchId === '0') return 'Admin';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'branches'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiMapPin className="inline mr-2" />
              Şube Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiUsers className="inline mr-2" />
              Kullanıcı Yönetimi
            </button>
          </div>

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Şubeler</h2>
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="btn-primary flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Şube Ekle
                </button>
              </div>

              {loadingBranches ? (
                <Loading />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Şube Adı
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Stok Durumu
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {branches.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                            Henüz şube eklenmemiş
                          </td>
                        </tr>
                      ) : (
                        branches.map((branch) => (
                          <tr key={branch.id} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {branch.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${
                                  branch.isStockEnabled
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-300'
                                    : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-300'
                                }`}
                              >
                                {branch.stockEnabled ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteBranch(branch.id)}
                                className="text-red-600 hover:text-red-900 ml-4"
                              >
                                <FiTrash2 className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kullanıcılar</h2>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="btn-primary flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Kullanıcı Ekle
                </button>
              </div>

              {loadingUsers ? (
                <Loading />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Kullanıcı Adı
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Hesap Tipi
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Şube
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                            Henüz kullanıcı eklenmemiş
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${
                                  user.accountType === 'ADMIN'
                                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-300'
                                    : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-300'
                                }`}
                              >
                                {user.accountType === 'ADMIN' ? 'Admin' : 'Şube'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getBranchName(user.branchId)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Branch Modal */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong border border-gray-100 animate-slide-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Şube Ekle</h3>
              <form onSubmit={handleCreateBranch}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube Adı
                  </label>
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Örn: İkitelli"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBranchModal(false);
                      setBranchForm({ name: '', isStockEnabled: true });
                    }}
                    className="btn-secondary"
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn-primary">
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong border border-gray-100 animate-slide-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Kullanıcı Ekle</h3>
              <form onSubmit={handleCreateUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="input-field"
                    placeholder="Kullanıcı adı"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="input-field"
                    placeholder="Şifre"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={userForm.branchId}
                      onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Şube Seçiniz</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setUserForm({ username: '', password: '', branchId: '' });
                    }}
                    className="btn-secondary"
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn-primary">
                    Oluştur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;

