import React, { useState, useEffect, useRef } from 'react';
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
  FiHelpCircle,
  FiAlertTriangle,
  FiChevronDown,
} from 'react-icons/fi';
import Loading from '../components/Loading';

const ABC_ORDER = { A: 1, B: 2, C: 3 };

const NO_DATA_MSG = 'Yeterli satış verisi yok';

const formatNumber = (num) => {
  if (num == null || Number.isNaN(num)) return '-';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(num);
};

/** Metrik değeri: geçersizse açıklayıcı mesaj göster. showNoDataMsg ile 0 da mesaj olarak gösterilir (talep yok) */
const formatMetricValue = (num, showNoDataMsg = false) => {
  const invalid = num == null || Number.isNaN(num) || (typeof num === 'number' && num < 0);
  const noDemand = showNoDataMsg && (invalid || (typeof num === 'number' && num === 0));
  if (invalid || noDemand) {
    return showNoDataMsg ? NO_DATA_MSG : '-';
  }
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

const HeaderTooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-flex text-gray-400 cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <FiHelpCircle size={14} />
      {visible && (
        <span className="absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 w-max max-w-[280px] px-3 py-2 text-left text-xs font-normal normal-case text-gray-700 bg-white rounded-xl border border-gray-200 shadow-lg ring-1 ring-black/5 pointer-events-none">
          <span className="absolute left-1/2 bottom-full -translate-x-1/2 border-[6px] border-transparent border-b-gray-200" style={{ marginBottom: '-1px' }} />
          <span className="absolute left-1/2 bottom-full -translate-x-1/2 border-[5px] border-transparent border-b-white" style={{ marginBottom: '1px' }} />
          {text}
        </span>
      )}
    </span>
  );
};

const ColHeader = ({ children, tooltip }) => (
  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
    <span className="inline-flex items-center gap-1 justify-end">
      {children}
      {tooltip && <HeaderTooltip text={tooltip} />}
    </span>
  </th>
);

const ColHeaderLeft = ({ children, tooltip }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
    <span className="inline-flex items-center gap-1">
      {children}
      {tooltip && <HeaderTooltip text={tooltip} />}
    </span>
  </th>
);

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
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [branchCategoryIdsMap, setBranchCategoryIdsMap] = useState({});
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);
      const map = {};
      const branchToCategories = {};
      for (const branch of branchesData || []) {
        try {
          const categories = await stockService.getProductCategories(branch.id);
          const categoryIds = (categories || []).filter((c) => c.id).map((c) => c.id);
          branchToCategories[branch.id] = categoryIds;
          (categories || []).forEach((c) => {
            if (c.id && c.name && !map[c.id]) map[c.id] = c.name;
          });
        } catch {
          // branch için kategori yoksa atla
        }
      }
      setCategoryMap(map);
      setBranchCategoryIdsMap(branchToCategories);
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

  const filteredMetrics =
    selectedBranchId === 'all' || !selectedBranchId
      ? metrics
      : metrics.filter((m) =>
          (branchCategoryIdsMap[selectedBranchId] || []).includes(m.productCategoryId)
        );

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
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
          <p className="text-gray-600 mb-2">
            Stok yönetimi için EOQ (ideal sipariş miktarı), ROP (sipariş verilme seviyesi) ve ABC öncelik sınıflandırması burada gösterilir.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Metrikler her gün saat 02:00&apos;de otomatik hesaplanır. Mevcut stok, ROP seviyesinin altına düştüğünde uyarı verilir.
          </p>

          {/* Aksiyonlar */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Şube:
              </label>
              <div className="relative min-w-[200px]" ref={branchDropdownRef}>
                <button
                  type="button"
                  onClick={() => setBranchDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm transition-all hover:border-primary-300 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <span>
                    {selectedBranchId === 'all' || !selectedBranchId
                      ? 'Tümü'
                      : branches.find((b) => b.id === selectedBranchId)?.name || selectedBranchId}
                  </span>
                  <FiChevronDown
                    className={`h-4 w-4 text-gray-500 shrink-0 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {branchDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-xl border border-gray-200 bg-white py-1.5 px-1.5 shadow-lg ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranchId('all');
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors rounded-lg ${
                        selectedBranchId === 'all' || !selectedBranchId
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-primary-50'
                      }`}
                    >
                      Tümü
                    </button>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBranchId(b.id);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors rounded-lg ${
                          selectedBranchId === b.id
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-primary-50'
                        }`}
                      >
                        {b.name || b.id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Metrikler</h2>
            <p className="text-sm text-gray-500 mb-4">
              Mevcut stok ROP altına düşen satırlarda uyarı görünür. EOQ değeri sipariş miktarını belirlemeniz için referanstır.
            </p>
            {loadingMetrics ? (
              <Loading />
            ) : metrics.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                Henüz envanter metrikleri oluşturulmamış. Önce &quot;Tüm Metrikleri Hesapla&quot; butonuna tıklayın veya ürün
                kategorileri ekleyin.
              </p>
            ) : filteredMetrics.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                Seçilen şube için envanter metrikleri bulunamadı. Başka bir şube seçin veya &quot;Tümü&quot; ile tüm verileri görüntüleyin.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <ColHeaderLeft>Ürün Kategorisi</ColHeaderLeft>
                      <ColHeaderLeft tooltip="Ürün boyutu (mm cinsinden)">Çap / Et Kalınlığı (mm)</ColHeaderLeft>
                      <ColHeader
                        tooltip="Ürün öncelik sınıfı: A = En yüksek değerli (önce yönet), B = Orta, C = Düşük öncelikli"
                      >
                        ABC Sınıfı
                      </ColHeader>
                      <ColHeader tooltip="Yıllık tahmini satış miktarı (kg)">Yıllık Talep (kg)</ColHeader>
                      <ColHeader tooltip="Ortalama günlük talep (kg)">Günlük Ort. Talep (kg)</ColHeader>
                      <ColHeader
                        tooltip="İdeal sipariş miktarı: Bu kadar kg sipariş vermek maliyet açısından en uygun"
                      >
                        EOQ (kg)
                      </ColHeader>
                      <ColHeader
                        tooltip="Sipariş eşiği: Stok bu seviyeye düştüğünde sipariş verilmeli"
                      >
                        ROP (kg)
                      </ColHeader>
                      <ColHeader
                        tooltip="Mevcut stok miktarı (kg). ROP altına düşerse sipariş gerekir"
                      >
                        Mevcut Stok (kg)
                      </ColHeader>
                      <ColHeader tooltip="Yıllık talep × birim fiyat">Yıllık Değer (₺)</ColHeader>
                      <ColHeader>Son Hesaplama</ColHeader>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedMetrics.map((m) => {
                      const hasDemand = m.annualDemand != null && !Number.isNaN(m.annualDemand) && m.annualDemand > 0;
                      const isBelowROP =
                        m.reorderPoint != null &&
                        m.stockKg != null &&
                        !Number.isNaN(m.reorderPoint) &&
                        !Number.isNaN(m.stockKg) &&
                        m.stockKg < m.reorderPoint;
                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-colors ${
                            isBelowROP ? 'bg-amber-50/50' : ''
                          }`}
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
                              title={
                                m.abcClass === 'A'
                                  ? 'Kritik ürün – en yüksek öncelik'
                                  : m.abcClass === 'B'
                                  ? 'Orta öncelikli ürün'
                                  : 'Düşük öncelikli ürün'
                              }
                            >
                              {m.abcClass || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {formatMetricValue(m.annualDemand, true)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {formatMetricValue(m.avgDailyDemand, true)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${hasDemand ? 'text-gray-900' : 'text-gray-400'}`}
                              title="İdeal sipariş miktarı"
                            >
                              {formatMetricValue(m.eoq, true)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${hasDemand ? 'text-gray-900' : 'text-gray-400'}`}
                              title="Bu seviyede sipariş verin"
                            >
                              {formatMetricValue(m.reorderPoint, true)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-1.5">
                              {isBelowROP && (
                                <span
                                  title={`Stok (${formatNumber(m.stockKg)} kg) ROP seviyesinin (${formatNumber(m.reorderPoint)} kg) altında – sipariş gerekli`}
                                  className="text-amber-600"
                                >
                                  <FiAlertTriangle size={18} />
                                </span>
                              )}
                              <span className={isBelowROP ? 'font-semibold text-amber-700' : 'text-gray-700'}>
                                {formatNumber(m.stockKg)}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">
                            {formatMetricValue(m.annualValue)}
                            {m.annualValue != null && !Number.isNaN(m.annualValue) && ' ₺'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">
                            {formatDate(m.lastCalculatedAt)}
                          </td>
                        </tr>
                      );
                    })}
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
                <p className="text-xs text-gray-500 mb-1">
                  Her siparişte oluşan sabit maliyet (ulaşım, işçilik vb.)
                </p>
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
                <p className="text-xs text-gray-500 mb-1">
                  Stokta tutmanın yıllık maliyet oranı (depolama, sermaye maliyeti)
                </p>
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
                <p className="text-xs text-gray-500 mb-1">
                  Siparişten teslimata kadar geçen süre – ROP hesaplamasında kullanılır
                </p>
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
