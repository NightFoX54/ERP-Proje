import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { branchService } from '../services/branchService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiEdit2, FiUsers, FiMapPin, FiAlertCircle, FiX } from 'react-icons/fi';
import Loading from '../components/Loading';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' or 'users'
  
  // Branches state
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', stockEnabled: true });
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchErrors, setBranchErrors] = useState({});

  // Users state
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', branchId: '' });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userErrors, setUserErrors] = useState({});
  
  // Delete confirmation modal state
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  
  // Delete branch confirmation modal state
  const [showDeleteBranchModal, setShowDeleteBranchModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [deleteBranchLoading, setDeleteBranchLoading] = useState(false);

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

  const validateBranchForm = () => {
    const newErrors = {};

    if (!branchForm.name || branchForm.name.trim() === '') {
      newErrors.name = 'Lütfen bu alanı doldurun';
    }

    setBranchErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    
    if (!validateBranchForm()) {
      return;
    }

    try {
      await branchService.createBranch(branchForm.name, branchForm.stockEnabled);
      toast.success('Şube başarıyla oluşturuldu');
      setShowBranchModal(false);
      setBranchForm({ name: '', stockEnabled: true });
      setBranchErrors({});
      fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Şube oluşturulurken bir hata oluştu');
    }
  };

  const handleToggleStockEnabled = async (branchId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await branchService.updateBranchStockEnabled(branchId, newStatus);
      toast.success(`Şube stok durumu ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi`);
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch stock status:', error);
      toast.error('Stok durumu güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteBranchClick = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    setBranchToDelete({ id: branchId, name: branch?.name || '' });
    setShowDeleteBranchModal(true);
  };

  const handleConfirmDeleteBranch = async () => {
    if (!branchToDelete) return;

    setDeleteBranchLoading(true);
    try {
      await branchService.deleteBranch(branchToDelete.id);
      toast.success('Şube başarıyla silindi');
      setShowDeleteBranchModal(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Şube silinirken bir hata oluştu');
    } finally {
      setDeleteBranchLoading(false);
    }
  };

  const validateUserForm = () => {
    const newErrors = {};

    if (!userForm.username || userForm.username.trim() === '') {
      newErrors.username = 'Lütfen bu alanı doldurun';
    }

    if (!userForm.password || userForm.password.trim() === '') {
      newErrors.password = 'Lütfen bu alanı doldurun';
    }

    if (!userForm.branchId || userForm.branchId === '') {
      newErrors.branchId = 'Lütfen bu alanı doldurun';
    }

    setUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!validateUserForm()) {
      return;
    }

    try {
      await authService.register(userForm.username, userForm.password, userForm.branchId);
      toast.success('Kullanıcı başarıyla oluşturuldu');
      setShowUserModal(false);
      setUserForm({ username: '', password: '', branchId: '' });
      setUserErrors({});
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

  const handleDeleteUserClick = (user) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteUserLoading(true);
    try {
      await authService.deleteAccount(userToDelete.id);
      toast.success('Kullanıcı başarıyla silindi');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Kullanıcı silinirken bir hata oluştu');
    } finally {
      setDeleteUserLoading(false);
    }
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
                              <button
                                onClick={() => handleToggleStockEnabled(branch.id, branch.stockEnabled)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer ${
                                  branch.stockEnabled
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-300 hover:from-green-200 hover:to-green-100'
                                    : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-gray-100'
                                }`}
                              >
                                {branch.stockEnabled ? 'Aktif' : 'Pasif'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteBranchClick(branch.id)}
                                className="text-red-600 hover:text-red-900 ml-4 transition-colors"
                                title="Şubeyi Sil"
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
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
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
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteUserClick(user)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Kullanıcıyı Sil"
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
        </div>

        {/* Branch Modal */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong border border-gray-100 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Yeni Şube Ekle</h3>
                <button
                  onClick={() => {
                    setShowBranchModal(false);
                    setBranchForm({ name: '', stockEnabled: true });
                    setBranchErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              <form onSubmit={handleCreateBranch} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={(e) => {
                      setBranchForm({ ...branchForm, name: e.target.value });
                      if (branchErrors.name) {
                        setBranchErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${branchErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Örn: İkitelli"
                  />
                  {branchErrors.name && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{branchErrors.name}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={branchForm.stockEnabled}
                      onChange={(e) => setBranchForm({ ...branchForm, stockEnabled: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Stok Yönetimi Aktif
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Bu şube için stok yönetimi aktif olacak mı?
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBranchModal(false);
                      setBranchForm({ name: '', stockEnabled: true });
                      setBranchErrors({});
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Yeni Kullanıcı Ekle</h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setUserForm({ username: '', password: '', branchId: '' });
                    setUserErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => {
                      setUserForm({ ...userForm, username: e.target.value });
                      if (userErrors.username) {
                        setUserErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.username;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${userErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Kullanıcı adı"
                  />
                  {userErrors.username && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{userErrors.username}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => {
                      setUserForm({ ...userForm, password: e.target.value });
                      if (userErrors.password) {
                        setUserErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.password;
                          return newErrors;
                        });
                      }
                    }}
                    className={`input-field ${userErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Şifre"
                  />
                  {userErrors.password && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{userErrors.password}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube <span className="text-red-500">*</span>
                  </label>
                  <div className="select-wrapper">
                    <select
                      value={userForm.branchId}
                      onChange={(e) => {
                        setUserForm({ ...userForm, branchId: e.target.value });
                        if (userErrors.branchId) {
                          setUserErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.branchId;
                            return newErrors;
                          });
                        }
                      }}
                      className={`input-field ${userErrors.branchId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    >
                      <option value="">Şube Seçiniz</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {userErrors.branchId && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{userErrors.branchId}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      setUserForm({ username: '', password: '', branchId: '' });
                      setUserErrors({});
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

        {/* Delete Branch Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteBranchModal}
          onClose={() => {
            if (!deleteBranchLoading) {
              setShowDeleteBranchModal(false);
              setBranchToDelete(null);
            }
          }}
          onConfirm={handleConfirmDeleteBranch}
          title="Şubeyi Sil"
          message={`"${branchToDelete?.name || ''}" şubesini silmek istediğinize emin misiniz?`}
          confirmText="Sil"
          cancelText="İptal"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={deleteBranchLoading}
        />

        {/* Delete User Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteUserModal}
          onClose={() => {
            if (!deleteUserLoading) {
              setShowDeleteUserModal(false);
              setUserToDelete(null);
            }
          }}
          onConfirm={handleConfirmDeleteUser}
          title="Kullanıcıyı Sil"
          message={`"${userToDelete?.username || ''}" kullanıcısını silmek istediğinize emin misiniz?`}
          warningMessage={
            userToDelete?.accountType === 'ADMIN'
              ? 'Bu bir admin hesabıdır. Admin hesabını silmek sistem yönetimini etkileyebilir.'
              : null
          }
          confirmText="Sil"
          cancelText="İptal"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={deleteUserLoading}
        />
      </div>
    </Layout>
  );
};

export default AdminPanel;

