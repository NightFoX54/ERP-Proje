import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { filterFixedFields, translateFieldName, getFieldType } from '../utils/fieldTranslations';

const ProductOrderModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product, 
  category 
}) => {
  const [formData, setFormData] = useState({
    diameter: product?.diameter || '',
    length: '',
    quantity: 1,
    fields: {},
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        diameter: product.diameter || '',
        length: '',
        quantity: 1,
        fields: {},
      });
      setErrors({});
    }
  }, [product, isOpen]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Adet zorunludur ve 0\'dan büyük olmalıdır';
    }

    if (!formData.length) {
      newErrors.length = 'Uzunluk girilmelidir';
    }

    // Dolu ürünlerde kontrol: girilen uzunluk * adet <= ürün uzunluğu
    if (formData.length && formData.quantity && product?.length !== undefined) {
      const totalLength = parseFloat(formData.length) * parseInt(formData.quantity);
      const productLength = parseFloat(product.length);
      
      if (totalLength > productLength) {
        newErrors.stock = `Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Extra fields'ı topla
    const extraFields = {};
    if (category?.finalFields) {
      const filteredFields = filterFixedFields(category.finalFields);
      Object.keys(filteredFields).forEach((key) => {
        if (formData.fields[key] !== undefined && formData.fields[key] !== null && formData.fields[key] !== '') {
          extraFields[key] = formData.fields[key];
        }
      });
    }

    // OrderItem formatına uygun obje oluştur
    const orderItem = {
      productCategoryId: category?.id || '',
      diameter: parseFloat(formData.diameter) || 0,
      length: formData.length ? parseFloat(formData.length) : null,
      weight: null,
      quantity: parseInt(formData.quantity) || 1,
      wastageLength: 0,
      wastageWeight: 0,
      ...extraFields,
    };

    onConfirm(orderItem);
  };

  const handleFieldChange = (key, value) => {
    setFormData({
      ...formData,
      fields: {
        ...formData.fields,
        [key]: value,
      },
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 shadow-strong border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Kesim Detayları</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sabit Alanlar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çap (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.diameter}
                className="input-field bg-gray-100 cursor-not-allowed"
                readOnly
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uzunluk (mm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => {
                  setFormData({ ...formData, length: e.target.value });
                  // Uzunluk girildiyse hatayı temizle
                  if (e.target.value && errors.length) {
                    setErrors({ ...errors, length: '' });
                  }
                  // Uzunluk değiştiğinde kontrol et: girilen uzunluk * adet <= ürün uzunluğu
                  if (e.target.value && formData.quantity && product?.length !== undefined) {
                    const totalLength = parseFloat(e.target.value) * parseInt(formData.quantity);
                    const productLength = parseFloat(product.length);
                    if (totalLength > productLength) {
                      setErrors({ ...errors, stock: `Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez` });
                    } else {
                      setErrors({ ...errors, stock: '' });
                    }
                  }
                }}
                className={`input-field ${errors.length || errors.stock ? 'border-red-500' : ''}`}
                step="0.01"
                min="0"
                required
              />
              {errors.length && (
                <p className="text-red-500 text-xs mt-1">{errors.length}</p>
              )}
              {errors.stock && (
                <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adet <span className="text-red-500">*</span>
                {product?.length !== undefined && (
                  <span className="text-gray-500 text-xs ml-2">(Ürün Uzunluğu: {product.length}mm)</span>
                )}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData({ ...formData, quantity: e.target.value });
                  // Adet değiştiğinde kontrol et: girilen uzunluk * adet <= ürün uzunluğu
                  if (e.target.value && formData.length && product?.length !== undefined) {
                    const totalLength = parseFloat(formData.length) * parseInt(e.target.value);
                    const productLength = parseFloat(product.length);
                    if (totalLength > productLength) {
                      setErrors({ ...errors, stock: `Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez` });
                    } else {
                      setErrors({ ...errors, stock: '' });
                    }
                  }
                }}
                className={`input-field ${errors.quantity || errors.stock ? 'border-red-500' : ''}`}
                step="1"
                min="1"
                required
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
              {errors.stock && (
                <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Sepete Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductOrderModal;

