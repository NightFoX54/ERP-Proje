// Backend'deki İngilizce alan isimlerini Türkçe'ye çevirme mapping'i
export const fieldTranslations = {
  weight: 'Ağırlık',
  purchasePrice: 'Satın Alma Fiyatı',
  purchaseKgPrice: 'Satın Alma Kilo Fiyatı',
  diameter: 'Çap',
  length: 'Uzunluk',
  stock: 'Stok',
  innerDiameter: 'İç Çap',
};

// String'i title case formatına çevir (her kelimenin ilk harfi büyük, diğerleri küçük)
const toTitleCase = (str) => {
  if (!str) return str;
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      // İlk harfi büyük yap (Türkçe karakterler için de çalışır)
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

// Alan ismini Türkçe'ye çevir veya formatla
export const translateFieldName = (fieldName) => {
  // Önce fieldTranslations'da tanımlı mı kontrol et
  if (fieldTranslations[fieldName]) {
    return fieldTranslations[fieldName];
  }
  
  // Tanımlı değilse, title case formatına çevir
  return toTitleCase(fieldName);
};

// Sabit alanlar - Bunlar Product entity'sinde zaten var, finalFields'da olmamalı
export const fixedProductFields = ['weight', 'purchasePrice', 'diameter', 'length', 'stock', 'purchaseKgPrice'];

// Bir alanın sabit alan olup olmadığını kontrol et
export const isFixedField = (fieldName) => {
  return fixedProductFields.includes(fieldName);
};

// finalFields'dan sabit alanları filtrele
// fields formatı: { fieldName: { datatype: "type", required: true/false } } veya { fieldName: "type" } (eski format)
export const filterFixedFields = (fields) => {
  const filtered = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    if (!isFixedField(key)) {
      filtered[key] = value;
    }
  });
  return filtered;
};

// finalFields'dan field type'ı al (yeni format: { datatype, required } veya eski format: string)
export const getFieldType = (fieldValue) => {
  if (typeof fieldValue === 'object' && fieldValue !== null && 'datatype' in fieldValue) {
    return fieldValue.datatype;
  }
  return fieldValue; // Eski format için geriye dönük uyumluluk
};

// finalFields'dan field'ın zorunlu olup olmadığını kontrol et
export const isFieldRequired = (fieldValue) => {
  if (typeof fieldValue === 'object' && fieldValue !== null && 'required' in fieldValue) {
    return fieldValue.required;
  }
  return false; // Eski format için varsayılan olarak false
};

