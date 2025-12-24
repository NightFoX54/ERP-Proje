import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiX } from 'react-icons/fi';
import { filterFixedFields, translateFieldName, getFieldType, isFieldRequired } from '../utils/fieldTranslations';
import { useAuth } from '../context/AuthContext';

const ProductModal = ({ category, product, canManage, onClose, onSave }) => {
  const { isAdmin } = useAuth();
  const isEdit = !!product;
  const [formData, setFormData] = useState({
    productCategoryId: category?.id || '',
    diameter: '',
    length: '',
    weight: '',
    purchasePrice: '',
    purchaseKgPrice: '',
    stock: '',
    fields: {},
  });
  const [loading, setLoading] = useState(false);
  const [extraFields, setExtraFields] = useState({});
  const [productTypes, setProductTypes] = useState([]);
  const [isProductTypeDolu, setIsProductTypeDolu] = useState(false);

  useEffect(() => {
    // Product types'ı yükle
    const fetchProductTypes = async () => {
      try {
        const data = await stockService.getProductTypes();
        setProductTypes(data || []);
      } catch (error) {
        console.error('Error fetching product types:', error);
      }
    };
    fetchProductTypes();
  }, []);

  useEffect(() => {
    // Ürün tipi "dolu" mu kontrol et
    if (category?.productTypeId && productTypes.length > 0) {
      const productType = productTypes.find(pt => pt.id === category.productTypeId);
      const isDolu = productType?.name?.toLowerCase() === 'dolu';
      setIsProductTypeDolu(isDolu);
      
      // Eğer "dolu" ise ve yeni ürün ekleniyorsa, stock'u 1 olarak ayarla
      if (isDolu && !product) {
        setFormData(prev => ({ ...prev, stock: '1' }));
      }
    } else {
      setIsProductTypeDolu(false);
    }
  }, [category?.productTypeId, productTypes, product]);

  useEffect(() => {
    if (product) {
      // Edit modunda: Hem purchasePrice hem purchaseKgPrice'ı göster (ikisini de hesapla)
      let displayPurchasePrice = product.purchasePrice || '';
      let displayPurchaseKgPrice = product.kgPrice || '';
      
      // Eğer purchasePrice varsa ama kgPrice yoksa, kgPrice'ı hesapla
      if (product.purchasePrice && (!product.kgPrice || product.kgPrice === 0) && product.weight && product.stock) {
        displayPurchaseKgPrice = (product.purchasePrice / product.stock / product.weight).toFixed(2);
      }
      
      // Eğer kgPrice varsa ama purchasePrice yoksa, purchasePrice'ı hesapla
      if (product.kgPrice && (!product.purchasePrice || product.purchasePrice === 0) && product.weight && product.stock) {
        displayPurchasePrice = (product.kgPrice * product.weight * product.stock).toFixed(2);
      }
      
      setFormData({
        productCategoryId: product.productCategoryId || category?.id || '',
        diameter: product.diameter || '',
        length: product.length || '',
        weight: product.weight || '',
        purchasePrice: displayPurchasePrice,
        purchaseKgPrice: displayPurchaseKgPrice,
        stock: product.stock || '',
        fields: product.fields || {},
      });
      setExtraFields(product.fields || {});
    } else if (category?.finalFields) {
      // Yeni ürün için extra fields'ı initialize et (sabit alanları hariç tut)
      const filteredFields = filterFixedFields(category.finalFields);
      const initialExtraFields = {};
      Object.keys(filteredFields).forEach((key) => {
        initialExtraFields[key] = '';
      });
      setExtraFields(initialExtraFields);
    }
  }, [product, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Eğer ürün tipi "dolu" değilse stock zorunlu kontrolü yap
    if (!formData.diameter || !formData.length || !formData.weight || (!isProductTypeDolu && !formData.stock)) {
      toast.error('Lütfen zorunlu alanları doldurunuz');
      return;
    }

    // Satın alma fiyatı veya kg fiyatı kontrolü: admin veya stok yönetimi yetkisi olanlar için (ikisinden biri zorunlu, ikisi birden girilemez)
    if (canManage) {
      const hasPurchasePrice = formData.purchasePrice && formData.purchasePrice.trim() !== '';
      const hasPurchaseKgPrice = formData.purchaseKgPrice && formData.purchaseKgPrice.trim() !== '';
      
      if (!hasPurchasePrice && !hasPurchaseKgPrice) {
        toast.error('Satın alma fiyatı veya satın alma kg fiyatından birini girmeniz zorunludur');
        return;
      }
      
      if (hasPurchasePrice && hasPurchaseKgPrice) {
        toast.error('Satın alma fiyatı ve satın alma kg fiyatından sadece birini girebilirsiniz');
        return;
      }
    }

    try {
      setLoading(true);
      
      const productData = {
        productCategoryId: formData.productCategoryId,
        diameter: parseInt(formData.diameter),
        length: parseFloat(formData.length),
        weight: parseFloat(formData.weight),
        stock: isProductTypeDolu ? 1 : parseInt(formData.stock),
        fields: extraFields,
      };

      // Eğer stok yönetimi yetkisi varsa ve purchasePrice girildiyse onu gönder, yoksa kgPrice gönder
      if (canManage) {
        const hasPurchasePrice = formData.purchasePrice && formData.purchasePrice.trim() !== '';
        if (hasPurchasePrice) {
          productData.purchasePrice = parseFloat(formData.purchasePrice);
        } else {
          productData.kgPrice = parseFloat(formData.purchaseKgPrice);
        }
      }

      if (isEdit) {
        await stockService.updateProduct(product.id, productData);
        toast.success('Ürün başarıyla güncellendi');
      } else {
        await stockService.createProduct(productData);
        toast.success('Ürün başarıyla oluşturuldu');
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Ürün kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExtraFieldChange = (key, value) => {
    setExtraFields({
      ...extraFields,
      [key]: value,
    });
  };

  const getInputType = (fieldValue) => {
    const type = getFieldType(fieldValue);
    switch (type) {
      case 'integer':
        return 'number';
      case 'double':
        return 'number';
      case 'string':
        return 'text';
      default:
        return 'text';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 shadow-strong border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* All Fields - Sabit alanlar ve extra fields birlikte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sabit Alanlar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çap (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.diameter}
                onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                className="input-field"
                required
                step="1"
              />
            </div>

            {/* İç çap field'ı - çap'tan hemen sonra */}
            {(() => {
              if (!category?.finalFields) return null;
              
              const filteredFields = filterFixedFields(category.finalFields);
              const isInnerDiameterField = (fieldKey) => {
                const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                return normalizedKey.includes('iccap') || 
                       normalizedKey.includes('innerdiameter') ||
                       normalizedKey.includes('iççap');
              };
              
              const innerDiameterKey = Object.keys(filteredFields).find(isInnerDiameterField);
              if (!innerDiameterKey) return null;
              
              const fieldValue = category.finalFields[innerDiameterKey];
              const fieldType = getFieldType(fieldValue);
              const required = isFieldRequired(fieldValue);
              
              return (
                <div key={innerDiameterKey}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translateFieldName(innerDiameterKey)} (mm)
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={getInputType(fieldValue)}
                    value={extraFields[innerDiameterKey] || ''}
                    onChange={(e) => handleExtraFieldChange(innerDiameterKey, e.target.value)}
                    className="input-field"
                    step={fieldType === 'double' ? '0.01' : '1'}
                    required={required}
                  />
                </div>
              );
            })()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uzunluk (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                className="input-field"
                required
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ağırlık (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="input-field"
                required
                step="0.01"
              />
            </div>

            {!isProductTypeDolu && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input-field"
                  required
                  step="1"
                  min="0"
                />
              </div>
            )}

            {/* Fiyat alanları stok yönetimi yetkisi olanlar için göster */}
            {canManage && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satın Alma Fiyatı (₺)
                    {!isEdit && <span className="text-red-500 ml-1">*</span>}
                    {!isEdit && <span className="text-gray-500 text-xs ml-2">(veya kg fiyatı)</span>}
                    {isEdit && <span className="text-gray-500 text-xs ml-2">(sadece görüntüleme)</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => {
                      if (!isEdit) {
                        const value = e.target.value;
                        setFormData({ 
                          ...formData, 
                          purchasePrice: value,
                          // Eğer purchasePrice giriliyorsa purchaseKgPrice'ı temizle
                          purchaseKgPrice: value ? '' : formData.purchaseKgPrice
                        });
                      }
                    }}
                    className="input-field"
                    step="0.01"
                    min="0"
                    disabled={isEdit || !!formData.purchaseKgPrice}
                    readOnly={isEdit}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satın Alma Kg Fiyatı (₺/kg)
                    {!isEdit && <span className="text-red-500 ml-1">*</span>}
                    {!isEdit && <span className="text-gray-500 text-xs ml-2">(veya toplam fiyat)</span>}
                    {isEdit && <span className="text-gray-500 text-xs ml-2">(sadece görüntüleme)</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.purchaseKgPrice}
                    onChange={(e) => {
                      if (!isEdit) {
                        const value = e.target.value;
                        setFormData({ 
                          ...formData, 
                          purchaseKgPrice: value,
                          // Eğer purchaseKgPrice giriliyorsa purchasePrice'ı temizle
                          purchasePrice: value ? '' : formData.purchasePrice
                        });
                      }
                    }}
                    className="input-field"
                    step="0.01"
                    min="0"
                    disabled={isEdit || !!formData.purchasePrice}
                    readOnly={isEdit}
                  />
                </div>
              </>
            )}

            {/* Extra Fields from Category - Sabit alanları ve iç çap hariç tut (iç çap zaten yukarıda gösterildi) */}
            {category?.finalFields && Object.keys(filterFixedFields(category.finalFields)).length > 0 && 
              Object.entries(category.finalFields)
                .filter(([key]) => {
                  // Sabit alanları filtrele
                  if (['weight', 'purchasePrice', 'purchaseKgPrice', 'kgPrice', 'diameter', 'length', 'stock'].includes(key)) {
                    return false;
                  }
                  // İç çap alanını filtrele (zaten yukarıda gösterildi)
                  const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                  const isInnerDiameter = normalizedKey.includes('iccap') || 
                                          normalizedKey.includes('innerdiameter') ||
                                          normalizedKey.includes('iççap');
                  return !isInnerDiameter;
                })
                .map(([key, fieldValue]) => {
                  const fieldType = getFieldType(fieldValue);
                  const required = isFieldRequired(fieldValue);
                  
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translateFieldName(key)}
                        {required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={getInputType(fieldValue)}
                        value={extraFields[key] || ''}
                        onChange={(e) => handleExtraFieldChange(key, e.target.value)}
                        className="input-field"
                        step={fieldType === 'double' ? '0.01' : '1'}
                        required={required}
                      />
                    </div>
                  );
                })
            }
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

