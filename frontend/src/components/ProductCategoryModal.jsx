import React, { useState, useEffect } from 'react';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiX, FiPlus, FiTrash2, FiInfo } from 'react-icons/fi';
import ExtraFieldModal from './ExtraFieldModal';
import { translateFieldName, isFixedField, filterFixedFields } from '../utils/fieldTranslations';

const ProductCategoryModal = ({ branchId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    productTypeId: '',
    branchId: branchId || '',
    finalFields: {},
  });
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [requiredFields, setRequiredFields] = useState({});
  const [extraFields, setExtraFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [showExtraFieldModal, setShowExtraFieldModal] = useState(false);

  useEffect(() => {
    fetchProductTypes();
  }, []);

  useEffect(() => {
    if (formData.productTypeId) {
      const productType = productTypes.find(pt => pt.id === formData.productTypeId);
      setSelectedProductType(productType);
      // Required fields'ı backend'den gelen haliyle tut (backend'e gönderirken aynı key'leri kullanmak için)
      setRequiredFields(productType?.requiredFields || {});
    }
  }, [formData.productTypeId, productTypes]);

  const fetchProductTypes = async () => {
    try {
      setLoadingTypes(true);
      const data = await stockService.getProductTypes();
      setProductTypes(data || []);
      console.log('[ProductCategoryModal] Product types loaded:', data);
    } catch (error) {
      console.error('Error fetching product types:', error);
      toast.error('Ürün tipleri yüklenirken bir hata oluştu');
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.productTypeId) {
      toast.error('Lütfen zorunlu alanları doldurunuz');
      return;
    }

    try {
      setLoading(true);

      // Required fields'ı yeni formata çevir (sabit alanları hariç tut)
      const filteredRequiredFields = filterFixedFields(requiredFields);
      const formattedRequiredFields = {};
      Object.entries(filteredRequiredFields).forEach(([key, value]) => {
        // Eğer value zaten obje formatındaysa (datatype, required), olduğu gibi kullan
        // Değilse (eski format), yeni formata çevir
        if (typeof value === 'object' && value !== null && 'datatype' in value) {
          formattedRequiredFields[key] = value;
        } else {
          formattedRequiredFields[key] = {
            datatype: value,
            required: true, // Required fields her zaman zorunlu
          };
        }
      });

      // Extra fields zaten yeni formatta (handleAddExtraField'da ayarlanıyor)
      const allFields = { ...formattedRequiredFields, ...extraFields };

      const categoryData = {
        name: formData.name,
        productTypeId: formData.productTypeId,
        branchId: formData.branchId,
        finalFields: allFields,
      };

      await stockService.createProductCategory(categoryData);
      toast.success('Ürün başlığı başarıyla oluşturuldu');
      onSave();
    } catch (error) {
      console.error('Error creating product category:', error);
      toast.error('Ürün başlığı oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraField = (field) => {
    // Mevcut alanları kontrol et (hem requiredFields hem extraFields'ı kontrol et)
    const allFields = { ...requiredFields, ...extraFields };
    const existingFieldNames = Object.keys(allFields);
    
    if (existingFieldNames.includes(field.name)) {
      toast.error('Bu alan adı zaten mevcut (zorunlu alanlar veya ekstra alanlar arasında)');
      return;
    }
    
    // Yeni format: { fieldName: { datatype: "type", required: true/false } }
    setExtraFields({
      ...extraFields,
      [field.name]: {
        datatype: field.type,
        required: field.required || false,
      },
    });
    toast.success(`${field.name} alanı eklendi`);
  };

  const removeExtraField = (fieldName) => {
    const newFields = { ...extraFields };
    delete newFields[fieldName];
    setExtraFields(newFields);
  };

  const getFieldTypeInput = (fieldName, fieldType, value, onChange, readOnly = false) => {
    const inputType = fieldType === 'integer' || fieldType === 'double' ? 'number' : 'text';
    const step = fieldType === 'double' ? '0.01' : '1';

    return (
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        className={`input-field ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        step={step}
        readOnly={readOnly}
        placeholder={readOnly ? 'Zorunlu alan (otomatik eklenecek)' : ''}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 shadow-strong border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Yeni Ürün Başlığı Ekle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Örn: İmalat, Islah, ST52, ST44"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Tipi <span className="text-red-500">*</span>
            </label>
            <div className="select-wrapper">
              <select
                value={formData.productTypeId}
                onChange={(e) => setFormData({ ...formData, productTypeId: e.target.value })}
                className="input-field"
                required
                disabled={loadingTypes}
              >
                <option value="">
                  {loadingTypes ? 'Yükleniyor...' : 'Ürün tipi seçiniz'}
                </option>
                {productTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Seçilen ürün tipine göre zorunlu alanlar otomatik eklenecektir
            </p>
          </div>

          {/* Required Fields Preview */}
          {selectedProductType && Object.keys(requiredFields).length > 0 && (
            <div className="border-2 border-primary-300 rounded-lg p-4 bg-primary-50">
              <div className="flex items-center mb-3">
                <FiInfo className="text-primary-600 mr-2" />
                <h4 className="text-sm font-semibold text-primary-900">
                  Zorunlu Alanlar
                </h4>
              </div>
              <p className="text-xs text-primary-700 mb-3">
                Bu alanlar ürün tipine göre otomatik olarak eklenir ve her üründe zorunludur.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(requiredFields).map(([key, value]) => {
                  // value artık obje olabilir (datatype, required) veya string olabilir (eski format)
                  const fieldType = typeof value === 'object' && value !== null && 'datatype' in value
                    ? value.datatype
                    : value;
                  const isRequired = typeof value === 'object' && value !== null && 'required' in value
                    ? value.required
                    : true; // Eski format için varsayılan olarak true
                  
                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2 bg-white rounded border ${
                        isFixedField(key) 
                          ? 'border-primary-200 bg-primary-50' 
                          : 'border-primary-200'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {translateFieldName(key)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isRequired && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                            Zorunlu
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                          {fieldType === 'string' ? 'Metin' : fieldType === 'integer' ? 'Tam Sayı' : 'Ondalıklı'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {selectedProductType && Object.keys(requiredFields).length === 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                Bu ürün tipi için zorunlu alan tanımlanmamış.
              </p>
            </div>
          )}

          {/* Extra Fields */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Ekstra Alanlar</h4>
              <button
                type="button"
                onClick={() => setShowExtraFieldModal(true)}
                className="btn-secondary text-sm py-1 px-3 flex items-center"
              >
                <FiPlus className="mr-1" />
                Alan Ekle
              </button>
            </div>

            {Object.keys(extraFields).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Henüz ekstra alan eklenmedi. "Alan Ekle" butonuna tıklayarak yeni alan ekleyebilirsiniz.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(extraFields).map(([fieldName, fieldData]) => {
                  // fieldData artık { datatype, required } formatında
                  const fieldType = typeof fieldData === 'object' && fieldData !== null && 'datatype' in fieldData
                    ? fieldData.datatype
                    : fieldData; // Eski format için geriye dönük uyumluluk
                  const isRequired = typeof fieldData === 'object' && fieldData !== null && 'required' in fieldData
                    ? fieldData.required
                    : false;
                  
                  return (
                    <div
                      key={fieldName}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {fieldName}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            Tip: {fieldType === 'string' ? 'Metin' : fieldType === 'integer' ? 'Tam Sayı' : 'Ondalıklı'}
                          </p>
                          {isRequired && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                              Zorunlu
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExtraField(fieldName)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Alanı Kaldır"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>

        {/* Extra Field Modal */}
        <ExtraFieldModal
          isOpen={showExtraFieldModal}
          onClose={() => setShowExtraFieldModal(false)}
          onSave={handleAddExtraField}
          existingFields={{ ...requiredFields, ...extraFields }}
        />
      </div>
    </div>
  );
};

export default ProductCategoryModal;

