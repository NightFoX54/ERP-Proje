import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingCart, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiBarChart2,
  FiCheck
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notificationDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.success('Çıkış yapıldı');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Bildirim dropdown'unu dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    // Bildirimi okundu olarak işaretle
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Dropdown'u kapat
    setNotificationDropdownOpen(false);
    
    // Sipariş detay sayfasına yönlendir
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return 'Az önce';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} dakika önce`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} saat önce`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} gün önce`;
      }
    } catch (error) {
      return '';
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Ana Sayfa' },
    { path: '/stock', icon: FiPackage, label: 'Stok Yönetimi' },
    { path: '/orders', icon: FiShoppingCart, label: 'Siparişler' },
    { path: '/statistics', icon: FiBarChart2, label: 'İstatistikler' },
  ];

  if (isAdmin()) {
    menuItems.push({ path: '/admin', icon: FiSettings, label: 'Admin Panel' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-lightBlue via-white to-pastel-lightBlue/30">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent relative">
                    Yılmazlar Çelik
                  </h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                        : 'text-gray-700 hover:bg-pastel-lightBlue/50 hover:text-primary-700'
                    }`}
                  >
                    <Icon className={`mr-2 ${isActive(item.path) ? 'text-white' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side - Notifications and User */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notificationDropdownRef}>
                <button 
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative p-2.5 text-gray-700 hover:text-primary-700 hover:bg-pastel-lightBlue/50 rounded-xl transition-all duration-300 group"
                >
                  <FiBell className="text-xl group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-primary-100/50">
                      <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            await markAllAsRead();
                            setNotificationDropdownOpen(false);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <FiCheck className="text-sm" />
                          Tümünü okundu işaretle
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-80">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          Bildirim bulunmuyor
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-pastel-lightBlue/30 ${
                              !notification.read ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                !notification.read ? 'bg-primary-500' : 'bg-transparent'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${
                                  !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {isAdmin() ? 'Admin' : 'Şube Kullanıcısı'}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                title="Çıkış Yap"
              >
                <FiLogOut className="text-xl" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-pastel-blue rounded-lg"
              >
                {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-700 hover:bg-pastel-blue'
                    }`}
                  >
                    <Icon className="mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {isAdmin() ? 'Admin' : 'Şube Kullanıcısı'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;

