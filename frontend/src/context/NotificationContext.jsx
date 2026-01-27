import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiBell } from 'react-icons/fi';
import api from '../utils/api';

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

    // İlk yüklemede bildirimleri çek
    checkNewNotifications();

    // Polling ile yeni bildirimleri kontrol et (her 45 saniyede bir)
    const interval = setInterval(() => {
      checkNewNotifications();
    }, 45000); // 45 saniye (30-60 arası orta nokta)

    return () => clearInterval(interval);
  }, []);

  const checkNewNotifications = async () => {
    try {
      const response = await api.get('/notifications/unread');
      const backendNotifications = response.data || [];

      // Backend'den gelen bildirimleri frontend formatına dönüştür
      const formattedNotifications = backendNotifications.map(notif => ({
        id: notif.id,
        orderId: notif.orderId,
        message: notif.message,
        read: notif.isRead || false,
        createdAt: notif.createdAt || new Date().toISOString(),
        accountId: notif.accountId,
        deliveryBranchId: notif.deliveryBranchId,
      }));

      // Mevcut bildirimlerle karşılaştır ve yeni olanları bul
      setNotifications(prevNotifications => {
        const existingIds = new Set(prevNotifications.map(n => n.id));
        const newNotifications = formattedNotifications.filter(n => !existingIds.has(n.id));
        
        // Yeni bildirimler için toast göster
        newNotifications.forEach(notif => {
          if (!notif.read) {
            toast.info(notif.message, {
              icon: <FiBell className="text-primary-500" />,
              position: 'top-right',
            });
          }
        });

        // Tüm bildirimleri birleştir (backend'den gelenler öncelikli)
        const allNotifications = [
          ...formattedNotifications,
          ...prevNotifications.filter(n => !formattedNotifications.find(bn => bn.id === n.id))
        ]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50); // Son 50 bildirimi tut

        // Unread count'u güncelle
        const unread = allNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);

        // localStorage'a kaydet
        localStorage.setItem('notifications', JSON.stringify(allNotifications));

        return allNotifications;
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Hata durumunda sessizce devam et, kullanıcıyı rahatsız etme
    }
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

