import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';
import Loading from '../components/Loading';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState({}); // categoryId -> categoryName map
  const [categoryDetails, setCategoryDetails] = useState({}); // categoryId -> full category data
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  // itemIndex -> [{ productId, quantity, cutWeight }]
  const [selectedProducts, setSelectedProducts] = useState({});
  const [availableProducts, setAvailableProducts] = useState({}); // itemIndex -> products array
  const [loadingProducts, setLoadingProducts] = useState({}); // itemIndex -> loading state

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[OrderDetail] Fetching order with id:', id);
      
      const branchesData = await branchService.getBranches();
      setBranches(branchesData || []);
      console.log('[OrderDetail] Branches loaded:', branchesData);

      const orderData = await orderService.getOrderById(id);
      console.log('[OrderDetail] Order data received:', orderData);
      
      if (!orderData) {
        console.warn('[OrderDetail] Order not found for id:', id);
        toast.error('Sipariş bulunamadı');
        setLoading(false);
        return;
      }
      
      setOrder(orderData);
      
      // OrderItems'daki tüm unique categoryId'leri topla
      const categoryIds = [...new Set(
        (orderData.orderItems || [])
          .map(item => item.productCategoryId)
          .filter(id => id)
      )];
      
      console.log('[OrderDetail] Category IDs to fetch:', categoryIds);
      
      // Kategorileri paralel olarak çek
      if (categoryIds.length > 0) {
        try {
          const categoryPromises = categoryIds.map(categoryId => 
            stockService.getProductCategoryById(categoryId)
              .then(data => ({ 
                id: categoryId, 
                name: data?.productCategories?.name || 'Bilinmeyen',
                data: data
              }))
              .catch(error => {
                console.error(`[OrderDetail] Error fetching category ${categoryId}:`, error);
                return { id: categoryId, name: 'Bilinmeyen', data: null };
              })
          );
          
          const categoryResults = await Promise.all(categoryPromises);
          const categoryMap = {};
          const categoryDetailsMap = {};
          categoryResults.forEach(({ id, name, data }) => {
            categoryMap[id] = name;
            if (data?.productCategories) {
              categoryDetailsMap[id] = data.productCategories;
            }
          });
          
          console.log('[OrderDetail] Categories loaded:', categoryMap);
          setCategories(categoryMap);
          setCategoryDetails(categoryDetailsMap);
        } catch (error) {
          console.error('[OrderDetail] Error fetching categories:', error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[OrderDetail] Error fetching order details:', error);
      console.error('[OrderDetail] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Sipariş detayları yüklenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      setLoading(false);
    }
  };

  const getBranchName = (branchId) => {
    if (!branchId) return 'Bilinmeyen';
    if (branchId === '0') return 'Admin';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'Bilinmeyen';
  };

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'Hazır') {
      // Hazır onayı için modal aç
      setShowReadyModal(true);
      return;
    }

    if (!window.confirm('Bu işlemi gerçekleştirmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setUpdating(true);
      await orderService.updateOrderStatus(id, newStatus);
      toast.success('Sipariş durumu güncellendi');
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenReadyModal = () => {
    setShowReadyModal(true);
    // Her order item için stok ürünlerini yükle ve başlangıç seçimi ekle
    if (order?.orderItems) {
      const initialSelectedProducts = {};
      order.orderItems.forEach((item, index) => {
        loadProductsForItem(item, index);
        // Her item için başlangıçta bir boş seçim ekle
        initialSelectedProducts[index] = [{
          productId: '',
          quantity: '',
          cutWeight: ''
        }];
      });
      setSelectedProducts(initialSelectedProducts);
    }
  };

  const loadProductsForItem = async (item, index) => {
    if (!item.productCategoryId || !item.diameter) return;
    
    const category = categoryDetails[item.productCategoryId];
    if (!category?.id) return;

    try {
      setLoadingProducts(prev => ({ ...prev, [index]: true }));
      const products = await stockService.getProductsByProductCategoryIdAndDiameter(
        category.id,
        item.diameter
      );
      setAvailableProducts(prev => ({ ...prev, [index]: products || [] }));
    } catch (error) {
      console.error(`Error loading products for item ${index}:`, error);
      setAvailableProducts(prev => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingProducts(prev => ({ ...prev, [index]: false }));
    }
  };

  const addProductToItem = (itemIndex) => {
    setSelectedProducts(prev => ({
      ...prev,
      [itemIndex]: [
        ...(prev[itemIndex] || []),
        {
          productId: '',
          quantity: '',
          cutWeight: ''
        }
      ]
    }));
  };

  const removeProductFromItem = (itemIndex, productIndex) => {
    setSelectedProducts(prev => {
      const newProducts = [...(prev[itemIndex] || [])];
      newProducts.splice(productIndex, 1);
      return {
        ...prev,
        [itemIndex]: newProducts
      };
    });
  };

  const updateProductData = (itemIndex, productIndex, field, value) => {
    setSelectedProducts(prev => {
      const newProducts = [...(prev[itemIndex] || [])];
      newProducts[productIndex] = {
        ...newProducts[productIndex],
        [field]: value
      };
      return {
        ...prev,
        [itemIndex]: newProducts
      };
    });
  };

  const handleConfirmReady = async () => {
    try {
      setUpdating(true);
      
      // selectedProducts'ı OrderCuttingDto formatına çevir
      const cuttingInfo = [];
      
      // Tüm sipariş ürünleri için kesim bilgilerini topla
      Object.keys(selectedProducts).forEach(itemIndex => {
        const itemSelectedProducts = selectedProducts[itemIndex];
        const orderItem = order.orderItems[parseInt(itemIndex)];
        const orderItemLength = orderItem?.length || null;
        
        // Her bir seçilen stok ürünü için kesim bilgisi oluştur
        itemSelectedProducts.forEach(selectedProduct => {
          if (selectedProduct.productId && selectedProduct.quantity && selectedProduct.cutWeight) {
            cuttingInfo.push({
              productId: selectedProduct.productId,
              quantity: parseInt(selectedProduct.quantity) || 0,
              cutLength: orderItemLength ? parseInt(orderItemLength) : null,
              totalCutWeight: parseFloat(selectedProduct.cutWeight) || 0
            });
          }
        });
      });

      // Kesim bilgilerini backend'e gönder
      const cuttingData = {
        orderId: id,
        cuttingInfo: cuttingInfo
      };

      await orderService.updateOrderCutting(id, cuttingData);
      
      // Sipariş durumunu güncelle
      await orderService.updateOrderStatus(id, 'Hazır');
      
      toast.success('Sipariş durumu güncellendi');
      setShowReadyModal(false);
      // Reset form
      setSelectedProducts({});
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusSteps = () => {
    // Backend'deki OrderStatus enum'una göre adımlar
    const steps = [
      { key: 'Oluşturuldu', label: 'Sipariş Oluşturuldu', icon: FiClock, color: 'gray' },
      { key: 'Onaylandı', label: 'Onaylandı', icon: FiCheck, color: 'yellow' },
      { key: 'Hazır', label: 'Hazır', icon: FiCheck, color: 'green' },
      { key: 'Çıktı', label: 'Çıktı', icon: FiCheck, color: 'purple' },
    ];

    if (!order) return steps;

    const currentStatus = order.orderStatus;
    const statusOrder = ['Oluşturuldu', 'Onaylandı', 'Hazır', 'Çıktı', 'İptal_Edildi'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      let status = 'pending'; // gray
      if (currentStatus === 'İptal_Edildi') {
        status = 'cancelled'; // red
      } else if (index < currentIndex) {
        status = 'completed'; // green
      } else if (index === currentIndex) {
        status = 'active'; // yellow
      }

      return { ...step, status };
    });
  };

  const canApprove = () => {
    if (!order) return false;
    return order.orderDeliveryBranchId === user?.branchId;
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="card text-center py-12">
          <p className="text-gray-500">Sipariş bulunamadı</p>
          <button onClick={() => navigate('/orders')} className="btn-primary mt-4">
            Siparişlere Dön
          </button>
        </div>
      </Layout>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Siparişlere Dön
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sipariş #{id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Müşteri: {order.customerName || 'Bilinmeyen'}
              </p>
              <p className="text-gray-600">
                Oluşturan: {getBranchName(order.orderGivenBranchId)} → Hazırlayan: {getBranchName(order.orderDeliveryBranchId)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sipariş Durumu</h2>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 md:space-x-4">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const colors = {
                completed: { 
                  bg: 'bg-gradient-to-br from-green-500 to-green-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-green-500/30',
                  ring: 'ring-4 ring-green-100'
                },
                active: { 
                  bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-yellow-500/30 animate-pulse',
                  ring: 'ring-4 ring-yellow-100'
                },
                pending: { 
                  bg: 'bg-gray-200', 
                  text: 'text-gray-500',
                  shadow: '',
                  ring: ''
                },
                cancelled: { 
                  bg: 'bg-gradient-to-br from-red-500 to-red-600', 
                  text: 'text-white',
                  shadow: 'shadow-lg shadow-red-500/30',
                  ring: 'ring-4 ring-red-100'
                },
              };
              
              const color = colors[step.status] || colors.pending;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${color.bg} ${color.text} ${color.shadow} ${color.ring} mb-3 transition-all duration-300`}
                    >
                      <Icon className="text-2xl" />
                    </div>
                    <p className={`text-xs text-center font-semibold ${
                      step.status === 'completed' || step.status === 'active' 
                        ? 'text-gray-900' 
                        : 'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`hidden md:block flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                      step.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-500 to-gray-300' 
                        : step.status === 'active'
                        ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-gray-300'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sipariş Detayları</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Miktar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {order.orderItems?.length > 0 ? (
                  order.orderItems.map((item, index) => {
                    // OrderItem'dan bilgileri çıkar
                    const diameter = item.diameter || '-';
                    const length = item.length ? `${item.length}mm` : '';
                    const weight = item.weight ? `${parseFloat(item.weight).toFixed(2)}kg` : '';
                    const quantity = item.quantity || 0;
                    const categoryName = categories[item.productCategoryId] || 'Bilinmeyen';
                    
                    return (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <p className="font-bold text-primary-700 mb-1">{categoryName}</p>
                            <p className="font-semibold">Çap: {diameter}mm</p>
                            {length && <p className="text-xs text-gray-500">Uzunluk: {length}</p>}
                            {weight && <p className="text-xs text-gray-500">Ağırlık: {weight}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg font-semibold">{quantity}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                      Siparişte ürün bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Total Price */}
          {order.totalPrice && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Toplam Fiyat:</span>
              <span className="text-xl font-bold text-primary-700">
                {order.totalPrice.toFixed(2)} ₺
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {canApprove() && order.orderStatus !== 'İptal_Edildi' && (
          <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-2 border-yellow-300 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Onay İşlemleri</h3>
            <div className="flex flex-wrap gap-3">
              {order.orderStatus === 'Oluşturuldu' && (
                <button
                  onClick={() => handleStatusUpdate('Onaylandı')}
                  disabled={updating}
                  className="btn-primary flex items-center"
                >
                  <FiCheck className="mr-2" />
                  Onayla
                </button>
              )}
              {order.orderStatus === 'Onaylandı' && (
                <button
                  onClick={handleOpenReadyModal}
                  disabled={updating}
                  className="btn-primary flex items-center bg-green-500 hover:bg-green-600"
                >
                  <FiCheck className="mr-2" />
                  Hazır Onayı
                </button>
              )}
              {order.orderStatus === 'Hazır' && (
                <button
                  onClick={() => handleStatusUpdate('Çıktı')}
                  disabled={updating}
                  className="btn-primary flex items-center bg-purple-500 hover:bg-purple-600"
                >
                  <FiCheck className="mr-2" />
                  Çıktı Onayı
                </button>
              )}
              {order.orderStatus === 'Oluşturuldu' && (
                <button
                  onClick={() => handleStatusUpdate('İptal_Edildi')}
                  disabled={updating}
                  className="btn-danger flex items-center"
                >
                  <FiX className="mr-2" />
                  İptal Et
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ready Confirmation Modal */}
        {showReadyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Hazır Onayı - Kesim Bilgileri</h2>
                  <button
                    onClick={() => setShowReadyModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Items with Product Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Ürünleri ve Kesim Kaynağı</h3>
                  <div className="space-y-6">
                    {order.orderItems?.map((item, index) => {
                      const diameter = item.diameter || '-';
                      const length = item.length ? `${item.length}mm` : '';
                      const weight = item.weight ? `${item.weight}kg` : '';
                      const quantity = item.quantity || 0;
                      const categoryName = categories[item.productCategoryId] || 'Bilinmeyen';
                      const products = availableProducts[index] || [];
                      const isLoading = loadingProducts[index];
                      const itemSelectedProducts = selectedProducts[index] || [];

                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="mb-4 pb-4 border-b border-gray-300">
                            <p className="font-bold text-primary-700 text-lg">{categoryName}</p>
                            <p className="text-sm text-gray-600">Çap: {diameter}mm | Sipariş Miktarı: {quantity} parça</p>
                            {length && <p className="text-xs text-gray-500">Uzunluk: {length}</p>}
                            {weight && <p className="text-xs text-gray-500">Ağırlık: {weight}</p>}
                          </div>
                          
                          {/* Selected Products for this item */}
                          <div className="space-y-4">
                            {itemSelectedProducts.map((selectedProduct, productIndex) => (
                              <div key={productIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-700">Kesim Kaynağı #{productIndex + 1}</h4>
                                  {itemSelectedProducts.length > 1 && (
                                    <button
                                      onClick={() => removeProductFromItem(index, productIndex)}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      type="button"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Stok Ürünü
                                    </label>
                                    {isLoading ? (
                                      <div className="text-sm text-gray-500">Yükleniyor...</div>
                                    ) : (
                                      <select
                                        value={selectedProduct.productId}
                                        onChange={(e) => updateProductData(index, productIndex, 'productId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      >
                                        <option value="">Stok ürünü seçin</option>
                                        {products.map((product) => (
                                          <option key={product.id} value={product.id}>
                                            Stok: {product.stock} | Uzunluk: {product.length}mm | Ağırlık: {product.weight ? parseFloat(product.weight).toFixed(2) : '-'}kg
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Kesilen Miktar (parça)
                                    </label>
                                    <input
                                      type="number"
                                      value={selectedProduct.quantity}
                                      onChange={(e) => updateProductData(index, productIndex, 'quantity', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="0"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Toplam Kesilen Ağırlık (kg)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={selectedProduct.cutWeight}
                                      onChange={(e) => updateProductData(index, productIndex, 'cutWeight', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Product Button */}
                          <button
                            onClick={() => addProductToItem(index)}
                            type="button"
                            className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center"
                          >
                            <FiPlus className="mr-2" />
                            Başka Bir Stok Ürünü Ekle
                          </button>

                          {products.length === 0 && !isLoading && (
                            <p className="text-xs text-red-500 mt-2">Bu özelliklerde stok ürünü bulunamadı</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowReadyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleConfirmReady}
                  disabled={updating}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FiCheck className="mr-2" />
                  Onayla ve Hazır Durumuna Geçir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetail;

