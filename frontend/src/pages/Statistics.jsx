import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { statisticsService } from '../services/statisticsService';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiTrendingUp, FiTrendingDown, FiPackage, FiShoppingCart, FiDollarSign, FiBarChart2, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Loading from '../components/Loading';
import { translateFieldName, getFieldType } from '../utils/fieldTranslations';

const Statistics = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [categoryMap, setCategoryMap] = useState({}); // categoryId -> categoryName mapping
  
  // Tarih aralığı
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // İstatistik verileri
  const [purchasedTotal, setPurchasedTotal] = useState(null);
  const [soldTotal, setSoldTotal] = useState(null);
  const [purchasedProducts, setPurchasedProducts] = useState(null);
  const [soldProducts, setSoldProducts] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'purchased', 'sold'
  
  // Accordion state - açık/kapalı durumları
  const [expandedBranches, setExpandedBranches] = useState({}); // { branchId: true/false }
  const [expandedCategories, setExpandedCategories] = useState({}); // { branchId-categoryId: true/false }
  const [expandedCustomers, setExpandedCustomers] = useState({}); // { branchId-customerName: true/false }
  const [expandedSoldCategories, setExpandedSoldCategories] = useState({}); // { branchId-customerName-categoryId: true/false }

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      fetchAllCategories();
    }
  }, [branches]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const categoryMapTemp = {};
      
      // Tüm şubeler için kategorileri çek
      for (const branch of branches) {
        try {
          const categories = await stockService.getProductCategories(branch.id);
          if (categories && Array.isArray(categories)) {
            categories.forEach(category => {
              if (category.id && category.name) {
                categoryMapTemp[category.id] = category.name;
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching categories for branch ${branch.id}:`, error);
        }
      }
      
      setCategoryMap(categoryMapTemp);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryName = (categoryId) => {
    return categoryMap[categoryId] || categoryId || 'Bilinmeyen Kategori';
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Toplam istatistikleri çek
      try {
        const purchasedTotalData = await statisticsService.getPurchasedProductsTotal(start, end);
        setPurchasedTotal(purchasedTotalData);
      } catch (error) {
        if (error.response?.status !== 403) {
          console.error('Error fetching purchased total:', error);
        }
      }

      const soldTotalData = await statisticsService.getSoldProductsTotal(start, end);
      setSoldTotal(soldTotalData);

      // Detaylı istatistikleri çek
      try {
        const purchasedData = await statisticsService.getPurchasedProductsBetweenDates(start, end);
        setPurchasedProducts(purchasedData);
      } catch (error) {
        console.error('Error fetching purchased products:', error);
      }

      const soldData = await statisticsService.getSoldProductsBetweenDates(start, end);
      setSoldProducts(soldData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('İstatistikler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId) return 'Bilinmeyen';
    if (branchId === '0') return 'Admin';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen';
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatWeight = (value) => {
    if (!value && value !== 0) return '-';
    return `${parseFloat(value).toFixed(2)} kg`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  const toggleBranch = (branchId) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const toggleCategory = (branchId, categoryId) => {
    const key = `${branchId}-${categoryId}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleCustomer = (branchId, customerName) => {
    const key = `${branchId}-${customerName}`;
    setExpandedCustomers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleSoldCategory = (branchId, customerName, categoryId) => {
    const key = `${branchId}-${customerName}-${categoryId}`;
    setExpandedSoldCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">İstatistikler</h1>
              <p className="text-gray-600">
                Satın alma ve satış istatistiklerini görüntüleyin
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-2" />
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiCalendar className="inline mr-2" />
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex space-x-1 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiBarChart2 className="inline mr-2" />
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('purchased')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'purchased'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiPackage className="inline mr-2" />
              Satın Alınan Ürünler
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'sold'
                  ? 'text-primary-700 border-b-2 border-primary-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiShoppingCart className="inline mr-2" />
              Satılan Ürünler
            </button>
          </div>

          {loading ? (
            <Loading message="İstatistikler yükleniyor..." />
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Total Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Purchased Total Price - Sadece Admin */}
                    {purchasedTotal && isAdmin() && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Alış Fiyatı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(purchasedTotal.totalPurchasePrice)}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-md">
                            <FiDollarSign className="text-2xl text-blue-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Purchased Total Weight */}
                    {purchasedTotal && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Alış Ağırlığı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatWeight(purchasedTotal.totalPurchaseWeight)}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl shadow-md">
                            <FiPackage className="text-2xl text-green-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Purchased Total Quantity */}
                    {purchasedTotal && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-teal-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Alış Miktarı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {purchasedTotal.totalPurchaseQuantity || 0} adet
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl shadow-md">
                            <FiPackage className="text-2xl text-teal-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sold Total Price - Sadece Admin */}
                    {soldTotal && isAdmin() && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Satış Fiyatı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(soldTotal.totalPrice)}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl shadow-md">
                            <FiDollarSign className="text-2xl text-purple-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sold Total Weight */}
                    {soldTotal && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-orange-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Satış Ağırlığı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatWeight(soldTotal.totalSoldWeight)}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl shadow-md">
                            <FiTrendingUp className="text-2xl text-orange-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wastage Weight */}
                    {soldTotal && soldTotal.totalWastageWeight && (
                      <div className="card hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 mb-1 font-medium">Toplam Fire Ağırlığı</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatWeight(soldTotal.totalWastageWeight)}
                            </p>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl shadow-md">
                            <FiTrendingDown className="text-2xl text-red-700" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Purchased Products Tab */}
              {activeTab === 'purchased' && (
                <div className="space-y-4">
                  {!purchasedProducts || Object.keys(purchasedProducts).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FiPackage className="mx-auto text-5xl mb-4 opacity-50" />
                      <p className="text-lg">Bu tarih aralığında satın alınan ürün bulunmuyor</p>
                    </div>
                  ) : (
                    Object.entries(purchasedProducts).map(([branchId, categories]) => {
                      const isBranchExpanded = expandedBranches[branchId];
                      const categoryCount = Object.keys(categories).length;
                      
                      // Şube toplamlarını hesapla
                      let branchTotalWeight = 0;
                      let branchTotalPrice = 0;
                      Object.values(categories).forEach(products => {
                        products.forEach(product => {
                          if (product.purchaseWeight) branchTotalWeight += product.purchaseWeight * (product.totalQuantity || 0);
                          if (product.purchaseTotalPrice) branchTotalPrice += product.purchaseTotalPrice;
                        });
                      });
                      
                      return (
                        <div key={branchId} className="card overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
                          {/* Şube Header */}
                          <button
                            onClick={() => toggleBranch(branchId)}
                            className={`w-full flex items-center justify-between p-5 rounded-lg transition-all duration-300 ${
                              isBranchExpanded 
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' 
                                : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 text-gray-900 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2.5 rounded-xl ${isBranchExpanded ? 'bg-white/20' : 'bg-gradient-to-br from-primary-100 to-primary-200'}`}>
                                <FiPackage className={`text-xl ${isBranchExpanded ? 'text-white' : 'text-primary-600'}`} />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-bold">
                                  {getBranchName(branchId)}
                                </h3>
                                <p className={`text-xs ${isBranchExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                                  {categoryCount} kategori
                                </p>
                              </div>
                            </div>
                            <div className={`p-2 rounded-lg transition-transform duration-300 ${isBranchExpanded ? 'bg-white/20 rotate-180' : 'bg-white/50'}`}>
                              <FiChevronDown className={`text-xl ${isBranchExpanded ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                          </button>

                          {/* Şube Toplamı */}
                          {isBranchExpanded && (
                            <div className="px-5 py-3 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">Şube Toplamı:</span>
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm font-bold text-gray-900">
                                    {formatWeight(branchTotalWeight)}
                                  </span>
                                  <span className="text-sm font-bold text-primary-700">
                                    {formatCurrency(branchTotalPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Kategoriler - Accordion */}
                          {isBranchExpanded && (
                            <div className="mt-3 space-y-3 pl-2 animate-fade-in">
                              {Object.entries(categories).map(([categoryId, products]) => {
                                const categoryKey = `${branchId}-${categoryId}`;
                                const isCategoryExpanded = expandedCategories[categoryKey];
                                
                                // Kategori toplamlarını hesapla
                                let categoryTotalWeight = 0;
                                let categoryTotalPrice = 0;
                                products.forEach(product => {
                                  if (product.purchaseWeight) categoryTotalWeight += product.purchaseWeight * (product.totalQuantity || 0);
                                  if (product.purchaseTotalPrice) categoryTotalPrice += product.purchaseTotalPrice;
                                });
                                const categoryKgPrice = categoryTotalWeight > 0 ? categoryTotalPrice / categoryTotalWeight : 0;
                                
                                return (
                                  <div key={categoryId} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                                    {/* Kategori Header */}
                                    <button
                                      onClick={() => toggleCategory(branchId, categoryId)}
                                      className={`w-full flex items-center justify-between p-4 transition-all duration-300 ${
                                        isCategoryExpanded 
                                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200' 
                                          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${isCategoryExpanded ? 'bg-gradient-to-br from-blue-100 to-indigo-200' : 'bg-gray-100'}`}>
                                          <FiPackage className={`text-sm ${isCategoryExpanded ? 'text-blue-700' : 'text-gray-600'}`} />
                                        </div>
                                        <div className="text-left">
                                          <h4 className="text-md font-semibold text-gray-900">
                                            {getCategoryName(categoryId)}
                                          </h4>
                                          <p className="text-xs text-gray-500">
                                            {products.length} ürün
                                          </p>
                                        </div>
                                      </div>
                                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${isCategoryExpanded ? 'bg-blue-100 rotate-180' : 'bg-gray-100'}`}>
                                        <FiChevronDown className={`text-sm ${isCategoryExpanded ? 'text-blue-700' : 'text-gray-500'}`} />
                                      </div>
                                    </button>

                                    {/* Kategori Toplamı */}
                                    {isCategoryExpanded && (
                                      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="font-medium text-gray-700">Kategori Toplamı:</span>
                                          <div className="flex items-center space-x-4">
                                            <span className="font-semibold text-gray-900">
                                              {formatWeight(categoryTotalWeight)}
                                            </span>
                                            <span className="font-semibold text-blue-700">
                                              {formatCurrency(categoryTotalPrice)}
                                            </span>
                                            {categoryKgPrice > 0 && (
                                              <span className="text-xs text-gray-600">
                                                ({formatCurrency(categoryKgPrice)}/kg)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Ürünler Tablosu */}
                                    {isCategoryExpanded && (
                                      <div className="mt-2 p-4 animate-fade-in">
                                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                                          <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100">
                                              <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Çap
                                                </th>
                                                {/* İç çap kolonu - çap'tan hemen sonra */}
                                                {(() => {
                                                  const allFieldKeys = new Set();
                                                  products.forEach(product => {
                                                    if (product.fields && typeof product.fields === 'object') {
                                                      Object.keys(product.fields).forEach(key => allFieldKeys.add(key));
                                                    }
                                                  });
                                                  const isInnerDiameterField = (fieldKey) => {
                                                    const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                                                    return normalizedKey.includes('iccap') || 
                                                           normalizedKey.includes('innerdiameter') ||
                                                           normalizedKey.includes('iççap');
                                                  };
                                                  const innerDiameterKey = Array.from(allFieldKeys).find(isInnerDiameterField);
                                                  return innerDiameterKey ? (
                                                    <th key={innerDiameterKey} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                      {translateFieldName(innerDiameterKey)}
                                                    </th>
                                                  ) : null;
                                                })()}
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Uzunluk
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Ağırlık
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Miktar
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Kg Fiyatı
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Toplam Fiyat
                                                </th>
                                                {/* Diğer Fields kolonları (iç çap hariç) */}
                                                {(() => {
                                                  const allFieldKeys = new Set();
                                                  products.forEach(product => {
                                                    if (product.fields && typeof product.fields === 'object') {
                                                      Object.keys(product.fields).forEach(key => allFieldKeys.add(key));
                                                    }
                                                  });
                                                  const isInnerDiameterField = (fieldKey) => {
                                                    const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                                                    return normalizedKey.includes('iccap') || 
                                                           normalizedKey.includes('innerdiameter') ||
                                                           normalizedKey.includes('iççap');
                                                  };
                                                  return Array.from(allFieldKeys)
                                                    .filter(key => !isInnerDiameterField(key))
                                                    .map(fieldKey => (
                                                      <th key={fieldKey} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        {translateFieldName(fieldKey)}
                                                      </th>
                                                    ));
                                                })()}
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                  Tarih
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                              {products.map((product, index) => {
                                                const kgPrice = product.purchaseKgPrice || 
                                                  (product.purchaseWeight && product.totalQuantity && product.purchaseTotalPrice 
                                                    ? product.purchaseTotalPrice / (product.purchaseWeight * product.totalQuantity) 
                                                    : 0);
                                                
                                                // Tüm field key'lerini topla
                                                const allFieldKeys = new Set();
                                                products.forEach(p => {
                                                  if (p.fields && typeof p.fields === 'object') {
                                                    Object.keys(p.fields).forEach(key => allFieldKeys.add(key));
                                                  }
                                                });
                                                
                                                // İç çap field'ını tespit et
                                                const isInnerDiameterField = (fieldKey) => {
                                                  const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                                                  return normalizedKey.includes('iccap') || 
                                                         normalizedKey.includes('innerdiameter') ||
                                                         normalizedKey.includes('iççap');
                                                };
                                                const innerDiameterKey = Array.from(allFieldKeys).find(isInnerDiameterField);
                                                const otherFieldKeys = Array.from(allFieldKeys).filter(key => !isInnerDiameterField(key));
                                                
                                                // İç çap değerini formatla
                                                const getInnerDiameterValue = () => {
                                                  if (!innerDiameterKey) return '-';
                                                  const fieldValue = product.fields?.[innerDiameterKey];
                                                  if (fieldValue === undefined || fieldValue === null || fieldValue === '') return '-';
                                                  
                                                  let displayValue = '-';
                                                  if (typeof fieldValue === 'number') {
                                                    if (Number.isInteger(fieldValue)) {
                                                      displayValue = fieldValue.toString();
                                                    } else {
                                                      displayValue = fieldValue.toFixed(2);
                                                    }
                                                    displayValue += ' mm';
                                                  } else {
                                                    // String değer için de sayısal kontrolü yap
                                                    const numValue = parseFloat(fieldValue);
                                                    if (!isNaN(numValue) && fieldValue !== '') {
                                                      if (Number.isInteger(numValue)) {
                                                        displayValue = numValue.toString();
                                                      } else {
                                                        displayValue = numValue.toFixed(2);
                                                      }
                                                      displayValue += ' mm';
                                                    } else {
                                                      displayValue = String(fieldValue);
                                                    }
                                                  }
                                                  return displayValue;
                                                };
                                                
                                                return (
                                                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                      {product.diameter ? `${product.diameter} mm` : '-'}
                                                    </td>
                                                    {/* İç çap değeri - çap'tan hemen sonra */}
                                                    {innerDiameterKey && (
                                                      <td className="px-4 py-3 text-sm text-gray-900">
                                                        {getInnerDiameterValue()}
                                                      </td>
                                                    )}
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                      {product.purchaseLength ? `${product.purchaseLength} mm` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                      {formatWeight(product.purchaseWeight)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                        {product.totalQuantity || 0}
                                                      </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                      {kgPrice > 0 ? formatCurrency(kgPrice) + '/kg' : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                      {formatCurrency(product.purchaseTotalPrice)}
                                                    </td>
                                                    {/* Diğer Fields değerlerini göster (iç çap hariç) */}
                                                    {otherFieldKeys.map(fieldKey => {
                                                      const fieldValue = product.fields?.[fieldKey];
                                                      let displayValue = '-';
                                                      
                                                      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                                                        if (typeof fieldValue === 'number') {
                                                          if (Number.isInteger(fieldValue)) {
                                                            displayValue = fieldValue.toString();
                                                          } else {
                                                            displayValue = fieldValue.toFixed(2);
                                                          }
                                                        } else {
                                                          displayValue = String(fieldValue);
                                                        }
                                                      }
                                                      
                                                      return (
                                                        <td key={fieldKey} className="px-4 py-3 text-sm text-gray-900">
                                                          {displayValue}
                                                        </td>
                                                      );
                                                    })}
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                      {formatDate(product.createdAt)}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Sold Products Tab */}
              {activeTab === 'sold' && (
                <div className="space-y-4">
                  {!soldProducts || Object.keys(soldProducts).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FiShoppingCart className="mx-auto text-5xl mb-4 opacity-50" />
                      <p className="text-lg">Bu tarih aralığında satılan ürün bulunmuyor</p>
                    </div>
                  ) : (() => {
                    // Tablo oluşturma fonksiyonu
                    const renderTable = (items, branchName = null) => {
                      // Tarihe göre sırala (yeniden eskiye)
                      const sortedItems = [...items].sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB - dateA;
                      });
                      
                      // Tüm field key'lerini topla
                      const allFieldKeys = new Set();
                      sortedItems.forEach(item => {
                        if (item.product?.fields && typeof item.product.fields === 'object') {
                          Object.keys(item.product.fields).forEach(key => allFieldKeys.add(key));
                        }
                      });
                      
                      // İç çap field'ını tespit et
                      const isInnerDiameterField = (fieldKey) => {
                        const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                        return normalizedKey.includes('iccap') || 
                               normalizedKey.includes('innerdiameter') ||
                               normalizedKey.includes('iççap');
                      };
                      
                      const innerDiameterKey = Array.from(allFieldKeys).find(isInnerDiameterField);
                      const otherFieldKeys = Array.from(allFieldKeys).filter(key => !isInnerDiameterField(key));
                      
                      return (
                        <div className="card">
                          {/* Şube Başlığı - sadece admin için ve branchName varsa */}
                          {branchName && (
                            <div className="mb-4 pb-4 border-b border-gray-200">
                              <h2 className="text-xl font-bold text-gray-900">
                                Şube: {branchName}
                              </h2>
                            </div>
                          )}
                          
                          {/* Tablo */}
                          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                            <table className="min-w-full divide-y divide-gray-100">
                              <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Tarih
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Müşteri
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Ürün Adı
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Dış Çap
                                  </th>
                                  {/* İç çap kolonu - dış çap'tan sonra */}
                                  {innerDiameterKey && (
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      {translateFieldName(innerDiameterKey)}
                                    </th>
                                  )}
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    adet
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    kilo
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    fiyat
                                  </th>
                                  {/* Diğer Fields kolonları (iç çap hariç) */}
                                  {otherFieldKeys.map(fieldKey => (
                                    <th key={fieldKey} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                      {translateFieldName(fieldKey)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {sortedItems.map((item, index) => {
                                  // Bu üründe hangi field'lar var?
                                  const productFields = item.product?.fields || {};
                                  const productFieldKeys = Object.keys(productFields);
                                  
                                  // İç çap değerini formatla
                                  const getInnerDiameterValue = () => {
                                    if (!innerDiameterKey) return null;
                                    const fieldValue = productFields[innerDiameterKey];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;
                                    
                                    if (typeof fieldValue === 'number') {
                                      return Number.isInteger(fieldValue) ? fieldValue.toString() : fieldValue.toFixed(2);
                                    } else {
                                      const numValue = parseFloat(fieldValue);
                                      if (!isNaN(numValue) && fieldValue !== '') {
                                        return Number.isInteger(numValue) ? numValue.toString() : numValue.toFixed(2);
                                      }
                                      return String(fieldValue);
                                    }
                                  };
                                  
                                  // Field değerini formatla
                                  const getFieldValue = (fieldKey) => {
                                    const fieldValue = productFields[fieldKey];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === '') return null;
                                    
                                    if (typeof fieldValue === 'number') {
                                      return Number.isInteger(fieldValue) ? fieldValue.toString() : fieldValue.toFixed(2);
                                    }
                                    return String(fieldValue);
                                  };
                                  
                                  // Adet değerini al (cutQuantity veya quantity)
                                  const quantity = item.cutQuantity || item.quantity || 0;
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                                      {/* Tarih */}
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {formatDate(item.createdAt)}
                                      </td>
                                      
                                      {/* Müşteri */}
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {item.customerName || '-'}
                                      </td>
                                      
                                      {/* Ürün Adı */}
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {getCategoryName(item.categoryId)}
                                      </td>
                                      
                                      {/* Dış Çap (diameter) */}
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.product?.diameter ? `${item.product.diameter}` : '-'}
                                      </td>
                                      
                                      {/* İç çap - varsa göster, yoksa kırmızı */}
                                      {innerDiameterKey && (
                                        <td className={`px-4 py-3 text-sm ${
                                          productFieldKeys.includes(innerDiameterKey) 
                                            ? 'text-gray-900 bg-white' 
                                            : 'text-gray-500 bg-red-100'
                                        }`}>
                                          {getInnerDiameterValue() || '-'}
                                        </td>
                                      )}
                                      
                                      {/* adet */}
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {quantity}
                                      </td>
                                      
                                      {/* kilo */}
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.totalSoldWeight ? `${parseFloat(item.totalSoldWeight).toFixed(2)}` : '-'}
                                      </td>
                                      
                                      {/* fiyat */}
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                        {item.totalPrice ? `${parseFloat(item.totalPrice).toFixed(2)} ₺` : '-'}
                                      </td>
                                      
                                      {/* Diğer Fields - üründe varsa normal, yoksa kırmızı */}
                                      {otherFieldKeys.map(fieldKey => {
                                        const hasField = productFieldKeys.includes(fieldKey);
                                        const fieldValue = getFieldValue(fieldKey);
                                        
                                        return (
                                          <td 
                                            key={fieldKey} 
                                            className={`px-4 py-3 text-sm ${
                                              hasField 
                                                ? 'text-gray-900 bg-white' 
                                                : 'text-gray-500 bg-red-100'
                                            }`}
                                          >
                                            {fieldValue || '-'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    };
                    
                    // Admin ise şube şube ayrı tablolar, değilse tek tablo
                    if (isAdmin()) {
                      // Admin için: Her şube için ayrı tablo
                      const branchTables = [];
                      
                      Object.entries(soldProducts).forEach(([branchId, customers]) => {
                        // Bu şubenin tüm satışlarını topla
                        const branchItems = [];
                        
                        Object.entries(customers).forEach(([customerName, categories]) => {
                          Object.entries(categories).forEach(([categoryId, products]) => {
                            products.forEach(product => {
                              branchItems.push({
                                ...product,
                                branchId,
                                customerName,
                                categoryId,
                              });
                            });
                          });
                        });
                        
                        if (branchItems.length > 0) {
                          const branchName = getBranchName(branchId);
                          branchTables.push(
                            <div key={branchId} className="space-y-4">
                              {renderTable(branchItems, branchName)}
                            </div>
                          );
                        }
                      });
                      
                      return <div className="space-y-6">{branchTables}</div>;
                    } else {
                      // Şube kullanıcısı için: Tek tablo
                      const allSoldItems = [];
                      
                      Object.entries(soldProducts).forEach(([branchId, customers]) => {
                        Object.entries(customers).forEach(([customerName, categories]) => {
                          Object.entries(categories).forEach(([categoryId, products]) => {
                            products.forEach(product => {
                              allSoldItems.push({
                                ...product,
                                branchId,
                                customerName,
                                categoryId,
                              });
                            });
                          });
                        });
                      });
                      
                      return renderTable(allSoldItems);
                    }
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;
