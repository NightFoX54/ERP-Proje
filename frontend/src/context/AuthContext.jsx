import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Login attempt for user:', username);
      const response = await authService.login(username, password);
      console.log('Login response:', response);
      
      if (response.token) {
        const userData = {
          token: response.token,
          branchId: response.branchId,
          accountType: response.accountType,
          username,
        };
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Giriş başarısız - Token alınamadı' };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // Status code'a göre kullanıcı dostu hata mesajları
      const status = error.response?.status;
      let errorMessage = 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.';
      
      if (status === 400 || status === 401) {
        // Backend'den gelen mesaj varsa onu kullan, yoksa varsayılan mesaj
        errorMessage = error.response?.data?.message || 'Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.';
      } else if (status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
      } else if (status === 404) {
        errorMessage = 'Kullanıcı bulunamadı.';
      } else if (status === 500) {
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message && error.message.includes('Request failed')) {
        // Teknik hata mesajları için varsayılan mesaj
        errorMessage = 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
      } else if (error.response?.data?.message) {
        // Backend'den özel mesaj varsa onu kullan
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (username, password, branchId) => {
    try {
      const response = await authService.register(username, password, branchId);
      
      if (response.token) {
        const userData = {
          token: response.token,
          branchId: response.branchId,
          accountType: response.accountType,
          username,
        };
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      return { success: false, error: 'Kayıt başarısız' };
    } catch (error) {
      // Status code'a göre kullanıcı dostu hata mesajları
      const status = error.response?.status;
      let errorMessage = 'Kayıt işlemi başarısız.';
      
      if (status === 400) {
        errorMessage = error.response?.data?.message || 'Geçersiz bilgiler. Lütfen tüm alanları doğru şekilde doldurun.';
      } else if (status === 409) {
        errorMessage = error.response?.data?.message || 'Bu kullanıcı adı zaten kullanılıyor.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.accountType === 'ADMIN';
  };

  const canManageStock = (branchId) => {
    if (isAdmin()) return true;
    return user?.branchId === branchId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        canManageStock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

