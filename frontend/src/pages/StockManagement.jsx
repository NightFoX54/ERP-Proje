import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { stockService } from '../services/stockService';
import { branchService } from '../services/branchService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiChevronRight } from 'react-icons/fi';
import Loading from '../components/Loading';
import ProductModal from '../components/ProductModal';
import ProductCategoryModal from '../components/ProductCategoryModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { filterFixedFields, translateFieldName, getFieldType } from '../utils/fieldTranslations';

const StockManagement = () => {
  const { user, isAdmin, canManageStock } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '0');
  
  // Confirmation modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Product delete confirmation modal state
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId!=='0') {
      fetchProductCategories();
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryDetails();
    } else {
      setCategoryDetails(null);
      setProducts([]);
    }
  }, [selectedCategory]);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data || []);
      
      // Admin değilse kendi şubesini seç
      if (!isAdmin() && user?.branchId) {
        setSelectedBranchId(user.branchId);
        const branch = data.find(b => b.id === user.branchId);
        setSelectedBranch(branch);
      } else if (isAdmin() && data.length > 0) {
        // Admin ise ilk şubeyi seç
        setSelectedBranchId(data[0].id);
        console.log('[StockManagement] Selected branch:', data[0]);
        setSelectedBranch(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Şubeler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const fetchProductCategories = async () => {
    try {
      const data = await stockService.getProductCategories(selectedBranchId);
      setProductCategories(data || []);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      toast.error('Ürün başlıkları yüklenirken bir hata oluştu');
    }
  };

  const fetchCategoryDetails = async () => {
    try {
      setLoadingProducts(true);
      const data = await stockService.getProductCategoryById(selectedCategory);
      setCategoryDetails(data.productCategories);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching category details:', error);
      toast.error('Ürün detayları yüklenirken bir hata oluştu');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranchId(branchId);
    const branch = branches.find(b => b.id === branchId);
    setSelectedBranch(branch);
    setSelectedCategory(null);
    setCategoryDetails(null);
    setProducts([]);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProductClick = (productId) => {
    setProductToDelete(productId);
    setShowDeleteProductModal(true);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleteProductLoading(true);
    try {
      await stockService.deleteProduct(productToDelete);
      toast.success('Ürün başarıyla silindi');
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      fetchCategoryDetails();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Ürün silinirken bir hata oluştu');
    } finally {
      setDeleteProductLoading(false);
    }
  };

  const handleProductSave = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    fetchCategoryDetails();
  };

  const handleCategorySave = () => {
    setShowCategoryModal(false);
    fetchProductCategories();
  };

  const handleDeleteCategoryClick = async (categoryId, categoryName) => {
    // Önce category detaylarını al ve ürün sayısını kontrol et
    let productCount = 0;
    try {
      const categoryData = await stockService.getProductCategoryById(categoryId);
      productCount = categoryData.products?.length || 0;
    } catch (error) {
      console.error('Error fetching category details:', error);
    }

    // Modal'ı aç ve bilgileri sakla
    setCategoryToDelete({ id: categoryId, name: categoryName, productCount });
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    try {
      await stockService.deleteProductCategory(categoryToDelete.id);
      toast.success('Ürün başlığı başarıyla silindi' + (categoryToDelete.productCount > 0 ? ` (${categoryToDelete.productCount} ürün de silindi)` : ''));
      
      // Eğer silinen category seçiliyse, seçimi temizle
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory(null);
        setCategoryDetails(null);
        setProducts([]);
      }
      
      setShowDeleteConfirmModal(false);
      setCategoryToDelete(null);
      fetchProductCategories();
    } catch (error) {
      console.error('Error deleting product category:', error);
      toast.error('Ürün başlığı silinirken bir hata oluştu');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canManage = canManageStock(selectedBranchId);

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Stok Yönetimi</h1>
              <p className="text-gray-600">
                Ürün başlıklarını ve stokları yönetin
              </p>
            </div>
            
            {isAdmin() && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-primary flex items-center justify-center"
              >
                <FiPlus className="mr-2" />
                Ürün Başlığı Ekle
              </button>
            )}
          </div>
        </div>

        {/* Branch Selector (Admin only) */}
        {isAdmin() && branches.length > 0 && (
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şube Seçiniz
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="input-field"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ürün Başlıkları
              </h2>
              
              {productCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiPackage className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>Henüz ürün başlığı eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`group relative w-full rounded-xl transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 transform scale-[1.02]'
                          : 'bg-gray-50 hover:bg-pastel-lightBlue/50 text-gray-900 hover:shadow-md'
                      }`}
                    >
                      <button
                        onClick={() => handleCategorySelect(category.id)}
                        className="w-full text-left p-4 pr-12"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{category.name}</span>
                          <FiChevronRight
                            className={`transition-transform duration-300 ${
                              selectedCategory === category.id 
                                ? 'text-white transform translate-x-1' 
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      </button>
                      
                      {isAdmin() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategoryClick(category.id, category.name);
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                            selectedCategory === category.id
                              ? 'text-white hover:bg-white/20'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Başlığı Sil"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Products List */}
          <div className="lg:col-span-2">
            {!selectedCategory ? (
              <div className="card">
                <div className="text-center py-12 text-gray-500">
                  <FiPackage className="mx-auto text-5xl mb-4 opacity-50" />
                  <p className="text-lg">Bir ürün başlığı seçin</p>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {categoryDetails?.name || 'Yükleniyor...'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {products.length} ürün
                    </p>
                  </div>
                  
                  {canManage && (
                    <button
                      onClick={handleCreateProduct}
                      className="btn-primary flex items-center"
                    >
                      <FiPlus className="mr-2" />
                      Ürün Ekle
                    </button>
                  )}
                </div>

                {loadingProducts ? (
                  <Loading message="Ürünler yükleniyor..." />
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Bu başlıkta henüz ürün bulunmuyor</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    {(() => {
                      // Ekstra alanları categoryDetails'tan al (sabit alanları filtrele)
                      const extraFields = categoryDetails?.finalFields 
                        ? filterFixedFields(categoryDetails.finalFields)
                        : {};
                      const extraFieldKeys = Object.keys(extraFields);
                      
                      // İç çap field'ını tespit et ve ayır
                      const isInnerDiameterField = (fieldKey) => {
                        const normalizedKey = fieldKey.toLowerCase().replace(/[_\s]/g, '');
                        return normalizedKey.includes('iccap') || 
                               normalizedKey.includes('innerdiameter') ||
                               normalizedKey.includes('iççap');
                      };
                      
                      const innerDiameterKey = extraFieldKeys.find(isInnerDiameterField);
                      const otherFieldKeys = extraFieldKeys.filter(key => !isInnerDiameterField(key));

                      return (
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                            <tr>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Çap
                          </th>
                          {/* İç çap kolonu - çap'tan hemen sonra */}
                          {innerDiameterKey && (
                            <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {translateFieldName(innerDiameterKey)}
                            </th>
                          )}
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Uzunluk
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Ağırlık
                          </th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Stok
                          </th>
                          {isAdmin() && (
                            <>
                              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Toplam Alış Fiyatı
                              </th>
                              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Kg Alış Fiyatı
                              </th>
                            </>
                          )}
                              {/* Diğer ekstra alanlar için dinamik kolonlar (iç çap hariç) */}
                              {otherFieldKeys.map((fieldKey) => (
                                <th
                                  key={fieldKey}
                                  className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                >
                                  {translateFieldName(fieldKey)}
                                </th>
                              ))}
                              {canManage && (
                                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  İşlemler
                                </th>
                              )}
                            </tr>
                          </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {products.map((product) => {
                          // İç çap değerini formatla
                          const getInnerDiameterValue = () => {
                            if (!innerDiameterKey) return '-';
                            const productFieldValue = product.fields?.[innerDiameterKey];
                            const fieldData = extraFields[innerDiameterKey];
                            const fieldType = getFieldType(fieldData);
                            
                            let displayValue = '-';
                            if (productFieldValue !== undefined && productFieldValue !== null && productFieldValue !== '') {
                              if (fieldType === 'double') {
                                displayValue = typeof productFieldValue === 'number' 
                                  ? productFieldValue.toFixed(2) 
                                  : parseFloat(productFieldValue).toFixed(2);
                              } else if (fieldType === 'integer') {
                                displayValue = typeof productFieldValue === 'number' 
                                  ? productFieldValue.toString() 
                                  : parseInt(productFieldValue).toString();
                              } else {
                                displayValue = String(productFieldValue);
                              }
                              
                              if (!isNaN(productFieldValue) && productFieldValue !== null && productFieldValue !== '') {
                                displayValue += ' mm';
                              }
                            }
                            
                            return displayValue;
                          };
                          
                          return (
                          <tr key={product.id} className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent transition-all duration-200 hover:shadow-sm">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.diameter || '-'} mm
                                </td>
                                {/* İç çap değeri - çap'tan hemen sonra */}
                                {innerDiameterKey && (
                                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getInnerDiameterValue()}
                                  </td>
                                )}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.length || '-'} mm
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {product.weight ? parseFloat(product.weight).toFixed(2) : '-'} kg
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      product.stock > 0
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {product.stock || 0}
                                  </span>
                                </td>
                                {isAdmin() && (
                                  <>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {(() => {
                                        // Toplam fiyatı hesapla
                                        let totalPrice = product.purchasePrice;
                                        if (!totalPrice && product.kgPrice && product.weight && product.stock) {
                                          totalPrice = product.kgPrice * product.weight * product.stock;
                                        }
                                        return totalPrice ? `${totalPrice.toFixed(2)} ₺` : '-';
                                      })()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {(() => {
                                        // Kg fiyatını hesapla
                                        let kgPrice = product.kgPrice;
                                        if (!kgPrice && product.purchasePrice && product.weight && product.stock) {
                                          kgPrice = product.purchasePrice / product.stock / product.weight;
                                        }
                                        return kgPrice ? `${kgPrice.toFixed(2)} ₺/kg` : '-';
                                      })()}
                                    </td>
                                  </>
                                )}
                                {/* Diğer ekstra alanların değerlerini göster (iç çap hariç) */}
                                {otherFieldKeys.map((fieldKey) => {
                                  const productFieldValue = product.fields?.[fieldKey];
                                  const fieldData = extraFields[fieldKey];
                                  const fieldType = getFieldType(fieldData);
                                  
                                  // Değeri formatla
                                  let displayValue = '-';
                                  if (productFieldValue !== undefined && productFieldValue !== null && productFieldValue !== '') {
                                    if (fieldType === 'double') {
                                      displayValue = typeof productFieldValue === 'number' 
                                        ? productFieldValue.toFixed(2) 
                                        : parseFloat(productFieldValue).toFixed(2);
                                    } else if (fieldType === 'integer') {
                                      displayValue = typeof productFieldValue === 'number' 
                                        ? productFieldValue.toString() 
                                        : parseInt(productFieldValue).toString();
                                    } else {
                                      displayValue = String(productFieldValue);
                                    }
                                  }

                                  return (
                                    <td
                                      key={fieldKey}
                                      className="px-4 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                      {displayValue}
                                    </td>
                                  );
                                })}
                                {canManage && (
                                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() => handleEditProduct(product)}
                                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                        title="Düzenle"
                                      >
                                        <FiEdit2 className="text-lg" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProductClick(product.id)}
                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Sil"
                                      >
                                        <FiTrash2 className="text-lg" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Modal */}
        {showProductModal && (
          <ProductModal
            category={categoryDetails}
            product={editingProduct}
            canManage={canManage}
            onClose={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
            onSave={handleProductSave}
          />
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <ProductCategoryModal
            branchId={selectedBranchId}
            onClose={() => setShowCategoryModal(false)}
            onSave={handleCategorySave}
          />
        )}

        {/* Delete Category Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirmModal}
          onClose={() => {
            if (!deleteLoading) {
              setShowDeleteConfirmModal(false);
              setCategoryToDelete(null);
            }
          }}
          onConfirm={handleConfirmDeleteCategory}
          title="Ürün Başlığını Sil"
          message={`"${categoryToDelete?.name || ''}" başlığını silmek istediğinize emin misiniz?`}
          warningMessage={
            categoryToDelete?.productCount > 0
              ? `Bu başlığa kayıtlı ${categoryToDelete.productCount} ürün bulunmaktadır. Bu başlığı silerseniz, bu başlığa ait tüm ürünler de kalıcı olarak silinecektir.`
              : null
          }
          confirmText="Sil"
          cancelText="İptal"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={deleteLoading}
        />

        {/* Delete Product Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteProductModal}
          onClose={() => {
            if (!deleteProductLoading) {
              setShowDeleteProductModal(false);
              setProductToDelete(null);
            }
          }}
          onConfirm={handleConfirmDeleteProduct}
          title="Ürünü Sil"
          message="Bu ürünü silmek istediğinize emin misiniz?"
          confirmText="Sil"
          cancelText="İptal"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={deleteProductLoading}
        />
      </div>
    </Layout>
  );
};

export default StockManagement;

