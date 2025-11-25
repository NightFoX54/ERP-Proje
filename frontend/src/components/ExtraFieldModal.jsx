import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ExtraFieldModal = ({ isOpen, onClose, onSave, existingFields = {} }) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('string');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!fieldName || fieldName.trim() === '') {
      newErrors.fieldName = 'Alan adı gereklidir';
    } else if (existingFields[fieldName]) {
      newErrors.fieldName = 'Bu alan adı zaten mevcut';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSave({
      name: fieldName.trim(),
      type: fieldType,
    });
    
    // Formu temizle
    setFieldName('');
    setFieldType('string');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setFieldName('');
    setFieldType('string');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-strong border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Yeni Ekstra Alan Ekle</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alan Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className={`input-field ${errors.fieldName ? 'border-red-500' : ''}`}
              placeholder="Örn: Açıklama, Not, Detay"
              required
            />
            {errors.fieldName && (
              <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alan Tipi <span className="text-red-500">*</span>
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="input-field"
              required
            >
              <option value="string">Metin (String)</option>
              <option value="integer">Tam Sayı (Integer)</option>
              <option value="double">Ondalıklı Sayı (Double)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {fieldType === 'string' && 'Metin verileri için kullanılır (örn: açıklama, not)'}
              {fieldType === 'integer' && 'Tam sayı değerler için kullanılır (örn: adet, miktar)'}
              {fieldType === 'double' && 'Ondalıklı sayılar için kullanılır (örn: fiyat, ölçü)'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtraFieldModal;

