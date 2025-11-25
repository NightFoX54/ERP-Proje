// Backend'deki İngilizce alan isimlerini Türkçe'ye çevirme mapping'i
export const fieldTranslations = {
  weight: 'Ağırlık',
  purchasePrice: 'Satın Alma Fiyatı',
  diameter: 'Çap',
  length: 'Uzunluk',
  stock: 'Stok',
  innerDiameter: 'İç Çap',
};

// Alan ismini Türkçe'ye çevir
export const translateFieldName = (fieldName) => {
  return fieldTranslations[fieldName] || fieldName;
};

// Sabit alanlar - Bunlar Product entity'sinde zaten var, finalFields'da olmamalı
export const fixedProductFields = ['weight', 'purchasePrice', 'diameter', 'length', 'stock'];

// Bir alanın sabit alan olup olmadığını kontrol et
export const isFixedField = (fieldName) => {
  return fixedProductFields.includes(fieldName);
};

// finalFields'dan sabit alanları filtrele
export const filterFixedFields = (fields) => {
  const filtered = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (!isFixedField(key)) {
      filtered[key] = value;
    }
  });
  return filtered;
};

