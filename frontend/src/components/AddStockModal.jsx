import React, { useState } from 'react';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const AddStockModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    addedStock: '',
    addedWeight: '',
    totalPurchasePrice: '',
    kgPrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getInnerDiameterValue = () => {
    if (!product?.fields) return null;
    for (const [key, value] of Object.entries(product.fields)) {
      const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
      if (
        normalizedKey.includes('iççap') ||
        normalizedKey.includes('iccap') ||
        normalizedKey.includes('innerdiameter')
      ) {
        return value;
      }
    }
    return null;
  };

  const innerDiameter = getInnerDiameterValue();

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Fiyat alanları birbirini devre dışı bırakır
      if (field === 'totalPurchasePrice' && value) updated.kgPrice = '';
      if (field === 'kgPrice' && value) updated.totalPurchasePrice = '';
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.addedStock || parseInt(formData.addedStock) <= 0) {
      newErrors.addedStock = 'Lütfen geçerli bir stok adedi girin';
    }
    if (!formData.addedWeight || parseFloat(formData.addedWeight) <= 0) {
      newErrors.addedWeight = 'Lütfen geçerli bir ağırlık girin';
    }
    const hasTotal = formData.totalPurchasePrice && formData.totalPurchasePrice.toString().trim() !== '';
    const hasKg = formData.kgPrice && formData.kgPrice.toString().trim() !== '';
    if (!hasTotal && !hasKg) {
      newErrors.totalPurchasePrice = 'Toplam alış fiyatı veya kg fiyatından birini giriniz';
      newErrors.kgPrice = 'Toplam alış fiyatı veya kg fiyatından birini giriniz';
    }
    if (hasTotal && hasKg) {
      newErrors.totalPurchasePrice = 'Sadece birini giriniz';
      newErrors.kgPrice = 'Sadece birini giriniz';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        addedStock: parseInt(formData.addedStock),
        addedWeight: parseFloat(formData.addedWeight),
      };
      if (formData.totalPurchasePrice) {
        payload.totalPurchasePrice = parseFloat(formData.totalPurchasePrice);
      } else {
        payload.kgPrice = parseFloat(formData.kgPrice);
      }
      await stockService.addStock(product.id, payload);
      toast.success('Stok başarıyla eklendi');
      onSave();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Stok eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const ErrorBox = ({ msg }) => (
    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
      <p className="text-sm text-gray-800">{msg}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 my-8 shadow-strong border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Stok Ekle</h3>
            <p className="text-sm text-gray-500 mt-1">
              Çap: <span className="font-medium text-gray-700">{product?.diameter} mm</span>
              {innerDiameter !== null && (
                <> &nbsp;·&nbsp; Et Kalınlığı: <span className="font-medium text-gray-700">{innerDiameter} mm</span></>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Mevcut stok bilgisi */}
        <div className="mb-5 p-3 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-gray-500">Mevcut Stok</p>
            <p className="font-semibold text-gray-800">{product?.stock ?? 0} adet</p>
          </div>
          <div>
            <p className="text-gray-500">Mevcut Ağırlık</p>
            <p className="font-semibold text-gray-800">{product?.weight?.toFixed(2) ?? '0.00'} kg</p>
          </div>
          <div>
            <p className="text-gray-500">Mevcut Kg Fiyatı</p>
            <p className="font-semibold text-gray-800">
              {product?.kgPrice ? `${product.kgPrice.toFixed(2)} ₺` : '-'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eklenecek Stok (adet) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.addedStock}
                onChange={(e) => handleChange('addedStock', e.target.value)}
                className={`input-field ${errors.addedStock ? 'border-red-500 focus:border-red-500' : ''}`}
                step="1"
                min="1"
              />
              {errors.addedStock && <ErrorBox msg={errors.addedStock} />}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eklenecek Ağırlık (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.addedWeight}
                onChange={(e) => handleChange('addedWeight', e.target.value)}
                className={`input-field ${errors.addedWeight ? 'border-red-500 focus:border-red-500' : ''}`}
                step="0.01"
                min="0.01"
              />
              {errors.addedWeight && <ErrorBox msg={errors.addedWeight} />}
            </div>
          </div>

          <div className="pt-1">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Fiyat Bilgisi <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-2">(sadece birini giriniz)</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toplam Alış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  value={formData.totalPurchasePrice}
                  onChange={(e) => handleChange('totalPurchasePrice', e.target.value)}
                  className={`input-field ${errors.totalPurchasePrice ? 'border-red-500 focus:border-red-500' : ''}`}
                  step="0.01"
                  min="0"
                  disabled={!!formData.kgPrice}
                />
                {errors.totalPurchasePrice && <ErrorBox msg={errors.totalPurchasePrice} />}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kg Alış Fiyatı (₺/kg)
                </label>
                <input
                  type="number"
                  value={formData.kgPrice}
                  onChange={(e) => handleChange('kgPrice', e.target.value)}
                  className={`input-field ${errors.kgPrice ? 'border-red-500 focus:border-red-500' : ''}`}
                  step="0.01"
                  min="0"
                  disabled={!!formData.totalPurchasePrice}
                />
                {errors.kgPrice && !errors.totalPurchasePrice && <ErrorBox msg={errors.kgPrice} />}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              İptal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ekleniyor...' : 'Stok Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
