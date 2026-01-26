import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiX, FiAlertCircle } from 'react-icons/fi';
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
  const [errors, setErrors] = useState({});

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
      
      // Düzenleme modunda: category'deki tüm alanları product.fields ile merge et
      if (category?.finalFields) {
        const filteredFields = filterFixedFields(category.finalFields);
        const mergedExtraFields = {};
        // Önce category'deki tüm alanları boş olarak initialize et
        Object.keys(filteredFields).forEach((key) => {
          mergedExtraFields[key] = '';
        });
        // Sonra product.fields'daki mevcut değerleri üzerine yaz
        if (product.fields) {
          Object.keys(product.fields).forEach((key) => {
            if (mergedExtraFields.hasOwnProperty(key)) {
              mergedExtraFields[key] = product.fields[key];
            }
          });
        }
        setExtraFields(mergedExtraFields);
      } else {
        setExtraFields(product.fields || {});
      }
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

  const validate = () => {
    const newErrors = {};

    // Zorunlu alanlar - number alanlar için güvenli kontrol
    const diameterValue = formData.diameter?.toString().trim();
    if (!diameterValue || diameterValue === '') {
      newErrors.diameter = 'Lütfen bu alanı doldurun';
    }

    const lengthValue = formData.length?.toString().trim();
    if (!lengthValue || lengthValue === '') {
      newErrors.length = 'Lütfen bu alanı doldurun';
    }

    const weightValue = formData.weight?.toString().trim();
    if (!weightValue || weightValue === '') {
      newErrors.weight = 'Lütfen bu alanı doldurun';
    }

    if (!isProductTypeDolu) {
      const stockValue = formData.stock?.toString().trim();
      if (!stockValue || stockValue === '') {
        newErrors.stock = 'Lütfen bu alanı doldurun';
      }
    }

    // Satın alma fiyatı veya kg fiyatı kontrolü: sadece yeni ürün ekleme modunda
    if (canManage && !isEdit) {
      const hasPurchasePrice = formData.purchasePrice && formData.purchasePrice.toString().trim() !== '';
      const hasPurchaseKgPrice = formData.purchaseKgPrice && formData.purchaseKgPrice.toString().trim() !== '';
      
      if (!hasPurchasePrice && !hasPurchaseKgPrice) {
        newErrors.purchasePrice = 'Satın alma fiyatı veya satın alma kg fiyatından birini girmeniz zorunludur';
        newErrors.purchaseKgPrice = 'Satın alma fiyatı veya satın alma kg fiyatından birini girmeniz zorunludur';
      }
      
      if (hasPurchasePrice && hasPurchaseKgPrice) {
        newErrors.purchasePrice = 'Satın alma fiyatı ve satın alma kg fiyatından sadece birini girebilirsiniz';
        newErrors.purchaseKgPrice = 'Satın alma fiyatı ve satın alma kg fiyatından sadece birini girebilirsiniz';
      }
    }

    // Extra fields validasyonu
    if (category?.finalFields) {
      const filteredFields = filterFixedFields(category.finalFields);
      Object.entries(filteredFields).forEach(([key, fieldValue]) => {
        const required = isFieldRequired(fieldValue);
        if (required) {
          const extraFieldValue = extraFields[key];
          const fieldType = getFieldType(fieldValue);
          
          // String alanlar için
          if (fieldType === 'string') {
            if (!extraFieldValue || (typeof extraFieldValue === 'string' && extraFieldValue.trim() === '')) {
              newErrors[`extra_${key}`] = 'Lütfen bu alanı doldurun';
            }
          } 
          // Number alanlar için (integer, double)
          else {
            if (extraFieldValue === null || extraFieldValue === undefined || extraFieldValue === '') {
              newErrors[`extra_${key}`] = 'Lütfen bu alanı doldurun';
            } else {
              const numValue = parseFloat(extraFieldValue);
              if (isNaN(numValue)) {
                newErrors[`extra_${key}`] = 'Lütfen bu alanı doldurun';
              }
            }
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        productCategoryId: formData.productCategoryId,
        diameter: parseFloat(formData.diameter),
        length: parseFloat(formData.length),
        weight: parseFloat(formData.weight),
        stock: isProductTypeDolu ? 1 : parseInt(formData.stock),
        fields: extraFields,
      };

      // Eğer stok yönetimi yetkisi varsa ve yeni ürün ekleniyorsa, purchasePrice veya kgPrice gönder (düzenleme modunda fiyatlar backend'de korunur)
      if (canManage && !isEdit) {
        const hasPurchasePrice = formData.purchasePrice && formData.purchasePrice.toString().trim() !== '';
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
      const errorMessage = error.response?.data?.message || error.message || 'Ürün kaydedilirken bir hata oluştu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleExtraFieldChange = (key, value) => {
    setExtraFields({
      ...extraFields,
      [key]: value,
    });
    // Hata varsa temizle
    if (errors[`extra_${key}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`extra_${key}`];
        return newErrors;
      });
    }
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
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                onChange={(e) => {
                  setFormData({ ...formData, diameter: e.target.value });
                  if (errors.diameter) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.diameter;
                      return newErrors;
                    });
                  }
                }}
                className={`input-field ${errors.diameter ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                step="0.1"
              />
              {errors.diameter && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                  <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-gray-800">{errors.diameter}</p>
                </div>
              )}
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
                    className={`input-field ${errors[`extra_${innerDiameterKey}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    step={fieldType === 'double' ? '0.01' : '1'}
                  />
                  {errors[`extra_${innerDiameterKey}`] && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{errors[`extra_${innerDiameterKey}`]}</p>
                    </div>
                  )}
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
                onChange={(e) => {
                  setFormData({ ...formData, length: e.target.value });
                  if (errors.length) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.length;
                      return newErrors;
                    });
                  }
                }}
                className={`input-field ${errors.length ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                step="0.01"
              />
              {errors.length && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                  <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-gray-800">{errors.length}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ağırlık (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => {
                  setFormData({ ...formData, weight: e.target.value });
                  if (errors.weight) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.weight;
                      return newErrors;
                    });
                  }
                }}
                className={`input-field ${errors.weight ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                step="0.01"
              />
              {errors.weight && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                  <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-gray-800">{errors.weight}</p>
                </div>
              )}
            </div>

            {!isProductTypeDolu && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => {
                    setFormData({ ...formData, stock: e.target.value });
                    if (errors.stock) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.stock;
                        return newErrors;
                      });
                    }
                  }}
                  className={`input-field ${errors.stock ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  step="1"
                  min="0"
                />
                {errors.stock && (
                  <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                    <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-gray-800">{errors.stock}</p>
                  </div>
                )}
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
                        // Hataları temizle
                        if (errors.purchasePrice || errors.purchaseKgPrice) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.purchasePrice;
                            delete newErrors.purchaseKgPrice;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    className={`input-field ${errors.purchasePrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    step="0.01"
                    min="0"
                    disabled={isEdit || !!formData.purchaseKgPrice}
                    readOnly={isEdit}
                  />
                  {errors.purchasePrice && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{errors.purchasePrice}</p>
                    </div>
                  )}
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
                        // Hataları temizle
                        if (errors.purchasePrice || errors.purchaseKgPrice) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.purchasePrice;
                            delete newErrors.purchaseKgPrice;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    className={`input-field ${errors.purchaseKgPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    step="0.01"
                    min="0"
                    disabled={isEdit || !!formData.purchasePrice}
                    readOnly={isEdit}
                  />
                  {errors.purchaseKgPrice && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-gray-800">{errors.purchaseKgPrice}</p>
                    </div>
                  )}
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
                        className={`input-field ${errors[`extra_${key}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        step={fieldType === 'double' ? '0.01' : '1'}
                      />
                      {errors[`extra_${key}`] && (
                        <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                          <FiAlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={16} />
                          <p className="text-sm text-gray-800">{errors[`extra_${key}`]}</p>
                        </div>
                      )}
                    </div>
                  );
                })
            }
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
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

