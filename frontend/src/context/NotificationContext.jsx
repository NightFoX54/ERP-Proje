import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiBell } from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// Kullanıcıya özel localStorage key'i oluştur (username kullanarak)
const getNotificationStorageKey = (username) => {
  return username ? `notifications_${username}` : 'notifications';
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Kullanıcı değiştiğinde bildirimleri temizle
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Kullanıcıya özel localStorage'dan bildirimleri yükle
    const storageKey = getNotificationStorageKey(user.username);
    const savedNotifications = localStorage.getItem(storageKey);
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Sadece okunmamış bildirimleri göster
        const unreadOnly = parsed.filter(n => !n.read);
        setNotifications(unreadOnly);
        setUnreadCount(unreadOnly.length);
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
  }, [user]);

  const checkNewNotifications = async () => {
    if (!user) return;

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

        // Backend'den gelen bildirimler zaten sadece okunmamış olanlar
        // Sadece backend'den gelen bildirimleri göster (okunmuş olanları localStorage'dan kaldır)
        const allNotifications = formattedNotifications
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 50); // Son 50 bildirimi tut

        // Unread count'u güncelle
        const unread = allNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);

        // Kullanıcıya özel localStorage'a kaydet (sadece okunmamış bildirimler)
        const storageKey = getNotificationStorageKey(user.username);
        localStorage.setItem(storageKey, JSON.stringify(allNotifications));

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

  const markAsRead = async (notificationId) => {
    if (!user) return;

    try {
      // Backend'e bildirimi okundu olarak işaretle
      await api.post('/notifications/read', null, {
        params: { notificationId }
      });
      
      // Okunmuş bildirimi listeden kaldır (backend'den artık gelmeyecek)
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
      
      // Kullanıcıya özel localStorage'ı güncelle
      const storageKey = getNotificationStorageKey(user.username);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Hata olsa bile local state'i güncelle
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.read).length);
      
      const storageKey = getNotificationStorageKey(user.username);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Tüm okunmamış bildirimleri backend'e gönder
    const unreadNotifications = notifications.filter(n => !n.read);
    try {
      await Promise.all(
        unreadNotifications.map(notif => 
          api.post('/notifications/read', null, {
            params: { notificationId: notif.id }
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    
    // Tüm bildirimleri listeden kaldır (artık backend'den gelmeyecekler)
    setNotifications([]);
    setUnreadCount(0);
    
    // Kullanıcıya özel localStorage'ı temizle
    const storageKey = getNotificationStorageKey(user.username);
    localStorage.setItem(storageKey, JSON.stringify([]));
  };

  const clearNotifications = () => {
    if (!user) return;
    
    setNotifications([]);
    setUnreadCount(0);
    
    // Kullanıcıya özel localStorage'ı temizle
    const storageKey = getNotificationStorageKey(user.username);
    localStorage.removeItem(storageKey);
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

