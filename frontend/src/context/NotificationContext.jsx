import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiBell } from 'react-icons/fi';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // localStorage'dan bildirimleri yükle
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }

    // Polling ile yeni bildirimleri kontrol et (her 30 saniyede bir)
    // TODO: WebSocket veya Server-Sent Events ile gerçek zamanlı bildirimler eklendiğinde güncellenecek
    const interval = setInterval(() => {
      checkNewNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkNewNotifications = async () => {
    // TODO: Backend'den yeni bildirimleri çek
    // Şimdilik placeholder - backend endpoint hazır olduğunda güncellenecek
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications].slice(0, 50); // Son 50 bildirimi tut
    setNotifications(updated);
    setUnreadCount(prev => prev + 1);
    localStorage.setItem('notifications', JSON.stringify(updated));

    // Toast bildirimi göster
    toast.info(notification.message, {
      icon: <FiBell className="text-primary-500" />,
      position: 'top-right',
    });
  };

  const markAsRead = (notificationId) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(prev => Math.max(0, prev - 1));
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

