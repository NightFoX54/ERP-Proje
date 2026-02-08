import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { inventoryMetricsService, inventoryConfigService } from '../services/inventoryMetricsService';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import {
  FiRefreshCw,
  FiSettings,
  FiX,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import Loading from '../components/Loading';

const ABC_ORDER = { A: 1, B: 2, C: 3 };

const formatNumber = (num) => {
  if (num == null) return '-';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('tr-TR');
  } catch {
    return dateStr;
  }
};

const InventoryMetrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [config, setConfig] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [calculateLoading, setCalculateLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    defaultOrderingCost: 1000,
    holdingRate: 0.2,
    reorderDays: 14,
  });
  const [configErrors, setConfigErrors] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const data = await inventoryMetricsService.getAll();
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
      if (error.response?.status === 403) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
      } else {
        toast.error('Envanter metrikleri yüklenirken hata oluştu');
      }
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = await inventoryConfigService.get();
      setConfig(data);
      if (data) {
        setConfigForm({
          defaultOrderingCost: data.defaultOrderingCost ?? 1000,
          holdingRate: data.holdingRate ?? 0.2,
          reorderDays: data.reorderDays ?? 14,
        });
      }
    } catch (error) {
      console.error('Error fetching inventory config:', error);
      if (error.response?.status === 403) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
      } else {
        toast.error('Envanter ayarları yüklenirken hata oluştu');
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const branches = await branchService.getBranches();
      const map = {};
      for (const branch of branches || []) {
        try {
          const categories = await stockService.getProductCategories(branch.id);
          (categories || []).forEach((c) => {
            if (c.id && c.name && !map[c.id]) map[c.id] = c.name;
          });
        } catch {
          // branch için kategori yoksa atla
        }
      }
      setCategoryMap(map);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchConfig();
    fetchCategories();
  }, []);

  const handleCalculateAll = async () => {
    try {
      setCalculateLoading(true);
      await inventoryMetricsService.calculateAll();
      toast.success('Tüm envanter metrikleri hesaplandı');
      fetchMetrics();
      fetchCategories();
    } catch (error) {
      console.error('Error calculating metrics:', error);
      if (error.response?.status === 403) {
        toast.error('Bu işlem için admin yetkisi gerekli');
      } else {
        toast.error('Hesaplama sırasında hata oluştu');
      }
    } finally {
      setCalculateLoading(false);
    }
  };

  const validateConfigForm = () => {
    const errs = {};
    if (configForm.defaultOrderingCost == null || configForm.defaultOrderingCost < 0) {
      errs.defaultOrderingCost = 'Geçerli bir sipariş maliyeti girin';
    }
    if (configForm.holdingRate == null || configForm.holdingRate < 0 || configForm.holdingRate > 1) {
      errs.holdingRate = '0-1 arası tutma oranı girin (örn: 0.2)';
    }
    if (configForm.reorderDays == null || configForm.reorderDays < 1) {
      errs.reorderDays = 'Geçerli bir gün sayısı girin';
    }
    setConfigErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!validateConfigForm() || !config?.id) return;
    try {
      setSavingConfig(true);
      await inventoryConfigService.update(config.id, configForm);
      toast.success('Ayarlar kaydedildi');
      setShowConfigModal(false);
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSavingConfig(false);
    }
  };

  const getCategoryName = (productCategoryId) =>
    categoryMap[productCategoryId] || productCategoryId || '-';

  const sortedMetrics = [...metrics].sort((a, b) => {
    const orderA = ABC_ORDER[a.abcClass] ?? 99;
    const orderB = ABC_ORDER[b.abcClass] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return (getCategoryName(a.productCategoryId) || '').localeCompare(
      getCategoryName(b.productCategoryId) || ''
    );
  });

  const openConfigModal = () => {
    if (config) {
      setConfigForm({
        defaultOrderingCost: config.defaultOrderingCost ?? 1000,
        holdingRate: config.holdingRate ?? 0.2,
        reorderDays: config.reorderDays ?? 14,
      });
      setConfigErrors({});
    }
    setShowConfigModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Envanter Metrikleri</h1>
          <p className="text-gray-600 mb-6">
            EOQ, ROP ve ABC sınıflandırması burada yönetilir. Metrikler her gün saat 02:00&apos;de otomatik hesaplanır.
          </p>

          {/* Aksiyonlar */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleCalculateAll}
              disabled={calculateLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <FiRefreshCw className={calculateLoading ? 'animate-spin' : ''} />
              {calculateLoading ? 'Hesaplanıyor...' : 'Tüm Metrikleri Hesapla'}
            </button>
            <button
              onClick={openConfigModal}
              disabled={!config}
              className="btn-secondary flex items-center gap-2 disabled:opacity-60"
            >
              <FiSettings />
              Envanter Ayarları
            </button>
          </div>

          {/* Config Özeti */}
          {config && !loadingConfig && (
            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Mevcut Ayarlar</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <span>
                  <strong>Sipariş Maliyeti:</strong> {formatNumber(config.defaultOrderingCost)} ₺
                </span>
                <span>
                  <strong>Tutma Oranı:</strong> {(config.holdingRate ?? 0) * 100}%
                </span>
                <span>
                  <strong>Teslimat Süresi:</strong> {config.reorderDays} gün
                </span>
              </div>
            </div>
          )}

          {/* Metrikler Tablosu */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrikler</h2>
            {loadingMetrics ? (
              <Loading />
            ) : metrics.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                Henüz envanter metrikleri oluşturulmamış. Önce &quot;Tüm Metrikleri Hesapla&quot; butonuna tıklayın veya ürün
                kategorileri ekleyin.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Kategori</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Çap / İç Çap</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">ABC</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Yıllık Talep</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Günlük Talep</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">EOQ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">ROP</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Yıllık Değer</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Son Hesaplama</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedMetrics.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {getCategoryName(m.productCategoryId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatNumber(m.diameter)} / {formatNumber(m.innerDiameter)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                              m.abcClass === 'A'
                                ? 'bg-amber-100 text-amber-800'
                                : m.abcClass === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {m.abcClass}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(m.annualDemand)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(m.avgDailyDemand)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(m.eoq)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(m.reorderPoint)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(m.annualValue)} ₺</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">{formatDate(m.lastCalculatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && config && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong border border-gray-100 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Envanter Ayarları</h3>
              <button
                onClick={() => !savingConfig && setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>
            <form onSubmit={handleSaveConfig} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varsayılan Sipariş Maliyeti (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={configForm.defaultOrderingCost}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, defaultOrderingCost: parseFloat(e.target.value) || 0 })
                  }
                  className={`input-field ${configErrors.defaultOrderingCost ? 'border-red-500' : ''}`}
                />
                {configErrors.defaultOrderingCost && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <FiAlertCircle size={16} />
                    {configErrors.defaultOrderingCost}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutma Oranı (0-1, örn: 0.2 = %20)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={configForm.holdingRate}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, holdingRate: parseFloat(e.target.value) || 0 })
                  }
                  className={`input-field ${configErrors.holdingRate ? 'border-red-500' : ''}`}
                />
                {configErrors.holdingRate && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <FiAlertCircle size={16} />
                    {configErrors.holdingRate}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teslimat Süresi (gün)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={configForm.reorderDays}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, reorderDays: parseInt(e.target.value, 10) || 0 })
                  }
                  className={`input-field ${configErrors.reorderDays ? 'border-red-500' : ''}`}
                />
                {configErrors.reorderDays && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <FiAlertCircle size={16} />
                    {configErrors.reorderDays}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => !savingConfig && setShowConfigModal(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2" disabled={savingConfig}>
                  <FiCheck />
                  {savingConfig ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default InventoryMetrics;
