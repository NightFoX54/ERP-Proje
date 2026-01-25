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
import ConfirmationModal from '../components/ConfirmationModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState({}); // categoryId -> categoryName map
  const [categoryDetails, setCategoryDetails] = useState({}); // categoryId -> full category data
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  
  // Status update confirmation modal state
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  // itemIndex -> [{ productId, quantity, cutWeight }]
  const [selectedProducts, setSelectedProducts] = useState({});
  const [availableProducts, setAvailableProducts] = useState({}); // itemIndex -> products array
  const [loadingProducts, setLoadingProducts] = useState({}); // itemIndex -> loading state
  const [soldProducts, setSoldProducts] = useState({}); // productId -> product mapping

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('[OrderDetail] Fetching order with id:', id);
      
      // ProductTypes'ı yükle
      const productTypesData = await stockService.getProductTypes();
      setProductTypes(productTypesData || []);
      
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

      // SoldItems varsa product'ları fetch et
      if (orderData.soldItems && orderData.soldItems.length > 0) {
        try {
          const productIds = [...new Set(
            orderData.soldItems
              .map(item => item.productId)
              .filter(id => id)
          )];
          
          if (productIds.length > 0) {
            const allProducts = await stockService.getProducts();
            const soldProductsMap = {};
            productIds.forEach(productId => {
              const product = allProducts.find(p => p.id === productId);
              if (product) {
                soldProductsMap[productId] = product;
              }
            });
            setSoldProducts(soldProductsMap);
          }
        } catch (error) {
          console.error('[OrderDetail] Error fetching sold products:', error);
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

  const getProductTypeName = (categoryId) => {
    if (!categoryId || !categoryDetails[categoryId]) return null;
    const category = categoryDetails[categoryId];
    if (!category.productTypeId) return null;
    const productType = productTypes.find(pt => pt.id === category.productTypeId);
    return productType?.name || null;
  };

  const handleStatusUpdate = (newStatus) => {
    if (newStatus === 'Hazır') {
      // Hazır onayı için modal aç
      setShowReadyModal(true);
      return;
    }

    // Diğer durum güncellemeleri için onay modalı göster
    setPendingStatusUpdate(newStatus);
    setShowStatusUpdateModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;

    setStatusUpdateLoading(true);
    try {
      await orderService.updateOrderStatus(id, pendingStatusUpdate);
      toast.success('Sipariş durumu güncellendi');
      setShowStatusUpdateModal(false);
      setPendingStatusUpdate(null);
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleOpenReadyModal = () => {
    setShowReadyModal(true);
    // Her order item için stok ürünlerini yükle ve başlangıç seçimi ekle
    if (order?.orderItems) {
      const initialSelectedProducts = {};
      order.orderItems.forEach((item, index) => {
        loadProductsForItem(item, index);
        // Her item için başlangıçta bir boş seçim ekle (base kgPrice orderItem'dan alınır)
        initialSelectedProducts[index] = [{
          productId: '',
          quantity: '',
          cutWeight: '',
          cutLength: '',
          kgPrice: item.kgPrice || ''
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
    // Base kgPrice'ı orderItem'dan al
    const orderItem = order.orderItems[parseInt(itemIndex)];
    const baseKgPrice = orderItem?.kgPrice || '';
    
    setSelectedProducts(prev => ({
      ...prev,
      [itemIndex]: [
        ...(prev[itemIndex] || []),
        {
          productId: '',
          quantity: '',
          cutWeight: '',
          cutLength: '',
          kgPrice: baseKgPrice
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

  const updateProductData = (itemIndex, productIndex, field, value, products) => {
    setSelectedProducts(prev => {
      const newProducts = [...(prev[itemIndex] || [])];
      const currentProduct = newProducts[productIndex];
      const orderItem = order?.orderItems?.[itemIndex];
      const orderQuantity = orderItem?.quantity || 0;
      
      // quantity (adet) için kontrol
      if (field === 'quantity' && currentProduct?.productId && products && order?.orderItems) {
        const selectedStockProduct = products.find(p => p.id === currentProduct.productId);
        const inputQuantity = parseInt(value);
        const productTypeName = getProductTypeName(orderItem?.productCategoryId);
        const isDolu = productTypeName?.toLowerCase() === 'dolu';
        
        if (!isNaN(inputQuantity)) {
          if (isDolu && selectedStockProduct && orderItem?.length) {
            // Dolu ürünler için: kesim uzunluğu * kesilen miktar <= stok ürünün uzunluğu
            const cutLength = parseFloat(orderItem.length);
            const stockProductLength = parseFloat(selectedStockProduct.length);
            const totalLength = cutLength * inputQuantity;
            
            if (totalLength > stockProductLength) {
              const maxQuantity = Math.floor(stockProductLength / cutLength);
              toast.error(`Kesim uzunluğu (${cutLength}mm) * kesilen miktar (${inputQuantity}) stok ürünün uzunluğunu (${stockProductLength}mm) geçemez. Maksimum: ${maxQuantity} adet`);
              value = maxQuantity > 0 ? maxQuantity.toString() : '0';
            } else {
              // Toplam adet kontrolü: Tüm seçilen ürünlerin toplam adedi sipariş miktarını geçemez
              let totalQuantity = 0;
              newProducts.forEach((prod, idx) => {
                if (idx !== productIndex && prod.quantity) {
                  totalQuantity += parseInt(prod.quantity) || 0;
                }
              });
              totalQuantity += inputQuantity;
              
              if (totalQuantity > orderQuantity) {
                toast.error(`Toplam adet (${totalQuantity}) sipariş miktarından (${orderQuantity} adet) fazla olamaz`);
                const maxAllowed = orderQuantity - totalQuantity + inputQuantity;
                value = maxAllowed > 0 ? maxAllowed.toString() : '0';
              }
            }
          } else if (!isDolu && selectedStockProduct && selectedStockProduct.stock !== undefined) {
            // Boru ürünler için: adet <= stok ve adet <= sipariş miktarı
            const maxStock = parseInt(selectedStockProduct.stock);
            
            if (inputQuantity > maxStock) {
              toast.error(`Girilen adet stoktan (${maxStock} adet) fazla olamaz`);
              value = maxStock.toString();
            } else if (inputQuantity > orderQuantity) {
              toast.error(`Girilen adet sipariş miktarından (${orderQuantity} adet) fazla olamaz`);
              value = orderQuantity.toString();
            } else {
              // Toplam adet kontrolü: Tüm seçilen ürünlerin toplam adedi sipariş miktarını geçemez
              let totalQuantity = 0;
              newProducts.forEach((prod, idx) => {
                if (idx !== productIndex && prod.quantity) {
                  totalQuantity += parseInt(prod.quantity) || 0;
                }
              });
              totalQuantity += inputQuantity;
              
              if (totalQuantity > orderQuantity) {
                toast.error(`Toplam adet (${totalQuantity}) sipariş miktarından (${orderQuantity} adet) fazla olamaz`);
                const maxAllowed = orderQuantity - totalQuantity + inputQuantity;
                value = maxAllowed > 0 ? maxAllowed.toString() : '0';
              }
            }
          }
        }
      }
      
      // cutWeight (toplam satış kilosu / toplam kesilen ağırlık) için stok ürün ağırlığı kontrolü
      if (field === 'cutWeight' && currentProduct?.productId && products) {
        const selectedStockProduct = products.find(p => p.id === currentProduct.productId);
        const inputWeight = parseFloat(value);
        
        if (selectedStockProduct && selectedStockProduct.weight !== undefined) {
          const maxWeight = parseFloat(selectedStockProduct.weight);
          
          // Girilen ağırlık stok ürünün ağırlığından fazla olamaz
          if (!isNaN(inputWeight) && inputWeight > maxWeight) {
            toast.error(`Girilen ağırlık stok ürünün ağırlığından (${maxWeight.toFixed(2)}kg) fazla olamaz`);
            value = maxWeight.toFixed(2);
          }
        }
      }
      
      newProducts[productIndex] = {
        ...currentProduct,
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
      // Validasyon: Tüm order item'lar için en az bir ürün seçilmiş olmalı ve kontroller
      if (order?.orderItems) {
        for (let i = 0; i < order.orderItems.length; i++) {
          const itemSelectedProducts = selectedProducts[i] || [];
          const orderItem = order.orderItems[i];
          const productTypeName = getProductTypeName(orderItem.productCategoryId);
          const isBoru = productTypeName?.toLowerCase() === 'boru';
          const products = availableProducts[i] || [];
          
          const isDolu = productTypeName?.toLowerCase() === 'dolu';
          
          const hasValidProduct = itemSelectedProducts.some(sp => {
            if (!sp.productId || sp.productId === '' || !sp.quantity || !sp.cutWeight) {
              return false;
            }
            return true;
          });
          
          if (!hasValidProduct) {
            toast.error('Lütfen tüm sipariş ürünleri için stok ürünü seçin ve gerekli bilgileri doldurun');
            return;
          }
          
          // Her seçilen ürün için validasyon kontrolleri
          let totalQuantity = 0;
          for (const selectedProduct of itemSelectedProducts) {
            if (selectedProduct.productId && selectedProduct.quantity) {
              const stockProduct = products.find(p => p.id === selectedProduct.productId);
              const inputQuantity = parseInt(selectedProduct.quantity);
              const orderQuantity = orderItem?.quantity || 0;
              
              if (isDolu && stockProduct && orderItem?.length) {
                // Dolu ürünler için: kesim uzunluğu * kesilen miktar <= stok ürünün uzunluğu
                const cutLength = parseFloat(orderItem.length);
                const stockProductLength = parseFloat(stockProduct.length);
                const totalLength = cutLength * inputQuantity;
                
                if (totalLength > stockProductLength) {
                  toast.error(`${stockProduct.diameter}mm ürün için kesim uzunluğu (${cutLength}mm) * kesilen miktar (${inputQuantity}) stok ürünün uzunluğunu (${stockProductLength}mm) geçemez`);
                  return;
                }
              } else if (!isDolu && stockProduct && stockProduct.stock !== undefined) {
                // Boru ürünler için: adet <= stok
                const maxStock = parseInt(stockProduct.stock);
                if (inputQuantity > maxStock) {
                  toast.error(`${stockProduct.diameter}mm ürün için girilen adet (${inputQuantity}) stoktan (${maxStock} adet) fazla olamaz`);
                  return;
                }
              }
              
              if (inputQuantity > orderQuantity) {
                toast.error(`${stockProduct?.diameter || ''}mm ürün için girilen adet (${inputQuantity}) sipariş miktarından (${orderQuantity} adet) fazla olamaz`);
                return;
              }
              
              totalQuantity += inputQuantity;
              
              // Ağırlık kontrolü: stok ürünün ağırlığından fazla olamaz
              if (selectedProduct.cutWeight && stockProduct && stockProduct.weight !== undefined) {
                const inputWeight = parseFloat(selectedProduct.cutWeight);
                const maxWeight = parseFloat(stockProduct.weight);
                if (inputWeight > maxWeight) {
                  toast.error(`${stockProduct.diameter}mm ürün için girilen ağırlık (${inputWeight.toFixed(2)}kg) stok ürünün ağırlığından (${maxWeight.toFixed(2)}kg) fazla olamaz`);
                  return;
                }
              }
            }
          }
          
          // Toplam adet kontrolü: tüm seçilen ürünlerin toplam adedi sipariş miktarını geçemez
          if (totalQuantity > orderItem.quantity) {
            toast.error(`Toplam adet (${totalQuantity}) sipariş miktarından (${orderItem.quantity} adet) fazla olamaz`);
            return;
          }
        }
      }

      setUpdating(true);
      
      // selectedProducts'ı OrderCuttingDto formatına çevir
      const cuttingInfo = [];
      
      // Tüm sipariş ürünleri için kesim bilgilerini topla
      Object.keys(selectedProducts).forEach(itemIndex => {
        const itemSelectedProducts = selectedProducts[itemIndex];
        const orderItem = order.orderItems[parseInt(itemIndex)];
        const orderItemLength = orderItem?.length || null;
        const productTypeName = getProductTypeName(orderItem.productCategoryId);
        const isBoru = productTypeName?.toLowerCase() === 'boru';
        
        // Her bir seçilen stok ürünü için kesim bilgisi oluştur
        itemSelectedProducts.forEach(selectedProduct => {
          const quantity = parseInt(selectedProduct.quantity) || 0;
          // Miktarı 0 olan ürünleri backend'e gönderme
          if (selectedProduct.productId && quantity > 0 && selectedProduct.cutWeight) {
            // Boru ürünleri için cutLength null olmalı, dolu ürünler için siparişteki uzunluk kullanılır
            cuttingInfo.push({
              productId: selectedProduct.productId,
              quantity: quantity,
              cutLength: isBoru ? null : (orderItemLength ? parseInt(orderItemLength) : null),
              totalCutWeight: parseFloat(selectedProduct.cutWeight) || 0,
              kgPrice: selectedProduct.kgPrice ? parseFloat(selectedProduct.kgPrice) : null
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
          
          {/* Sipariş Ürünleri (Order Items) */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Sipariş Ürünleri</h3>
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
                      
                      // Tüm ekstra alanları formatla (diameter, length, weight, quantity, productCategoryId, wastageLength, wastageWeight, kgPrice hariç)
                      const excludedFields = ['diameter', 'length', 'weight', 'quantity', 'productCategoryId', 'wastageLength', 'wastageWeight', 'kgPrice'];
                      const formatFieldValue = (key, value) => {
                        // İç çap alanlarını tespit et
                        const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                        const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                normalizedKey.includes('innerdiameter') ||
                                                normalizedKey.includes('iççap') ||
                                                normalizedKey === 'icap' ||
                                                normalizedKey === 'innerdiam';
                        
                        // Eğer iç çap ise ve değer sayısal ise mm ekle
                        if (isInnerDiameter && !isNaN(value) && value !== null && value !== '') {
                          return `${value}mm`;
                        }
                        return value;
                      };
                      
                      const extraFields = Object.entries(item)
                        .filter(([key]) => !excludedFields.includes(key))
                        .map(([key, value]) => {
                          if (value === null || value === undefined || value === '') return null;
                          // Key'i daha okunabilir hale getir
                          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                          const formattedValue = formatFieldValue(key, value);
                          return { key: formattedKey, value: formattedValue };
                        })
                        .filter(field => field !== null);
                      
                      return (
                        <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div>
                              <p className="font-bold text-primary-700 mb-1">{categoryName}</p>
                              <p className="font-semibold">Çap: {diameter}mm</p>
                              {length && <p className="text-xs text-gray-500">Uzunluk: {length}</p>}
                              {weight && <p className="text-xs text-gray-500">Ağırlık: {weight}</p>}
                              {item.kgPrice && (
                                <p className="text-xs text-gray-500">Kilo Fiyatı: {parseFloat(item.kgPrice).toFixed(2)} ₺/kg</p>
                              )}
                              {extraFields.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {extraFields.map((field, fieldIndex) => (
                                    <p key={fieldIndex} className="text-xs text-gray-500">
                                      {field.key}: {field.value}
                                    </p>
                                  ))}
                                </div>
                              )}
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
          </div>

          {/* Teslim Edilen Ürünler (Sold Items) - Sadece Hazır veya Çıktı durumunda göster */}
          {(order.orderStatus === 'Hazır' || order.orderStatus === 'Çıktı') && order.soldItems && order.soldItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Teslim Edilen Ürünler</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Ürün
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Satılan Ağırlık (kg)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Kilo Fiyatı (₺/kg)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Toplam Fiyat (₺)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {order.soldItems.map((item, index) => {
                      // ProductId'den product bilgilerini al
                      const product = soldProducts[item.productId];
                      const diameter = product?.diameter || '-';
                      const categoryName = product?.productCategoryId ? (categories[product.productCategoryId] || 'Bilinmeyen') : 'Bilinmeyen';
                      
                      // Product fields'dan ekstra bilgileri al
                      const formatFieldValue = (key, value) => {
                        const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                        const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                normalizedKey.includes('innerdiameter') ||
                                                normalizedKey.includes('iççap') ||
                                                normalizedKey === 'icap' ||
                                                normalizedKey === 'innerdiam';
                        
                        if (isInnerDiameter && !isNaN(value) && value !== null && value !== '') {
                          return `${value}mm`;
                        }
                        return value;
                      };
                      
                      const extraFields = product?.fields ? Object.entries(product.fields)
                        .filter(([key, value]) => value !== null && value !== undefined && value !== '')
                        .map(([key, value]) => {
                          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                          const formattedValue = formatFieldValue(key, value);
                          return { key: formattedKey, value: formattedValue };
                        })
                        .filter(field => field !== null) : [];
                      
                      const totalSoldWeight = item.totalSoldWeight || 0;
                      const kgPrice = item.kgPrice || 0;
                      const totalPrice = item.totalPrice || 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gradient-to-r hover:from-green-50/30 hover:to-transparent transition-all duration-200">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div>
                              <p className="font-bold text-green-700 mb-1">{categoryName}</p>
                              <p className="font-semibold">Çap: {diameter}mm</p>
                              {extraFields.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {extraFields.map((field, fieldIndex) => (
                                    <p key={fieldIndex} className="text-xs text-gray-500">
                                      {field.key}: {field.value}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-green-100 rounded-lg font-semibold text-green-800">
                              {parseFloat(totalSoldWeight).toFixed(2)} kg
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {parseFloat(kgPrice).toFixed(2)} ₺/kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {parseFloat(totalPrice).toFixed(2)} ₺
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
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
                  <h2 className="text-2xl font-bold text-gray-900">Hazır Onayı - Stok Bilgileri</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Ürünleri ve Stok Kaynağı</h3>
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
                      const productTypeName = getProductTypeName(item.productCategoryId);
                      const isBoru = productTypeName?.toLowerCase() === 'boru';
                      const isDolu = productTypeName?.toLowerCase() === 'dolu';

                      // Etiketleri ürün tipine göre belirle
                      const sourceLabel = isBoru ? 'Stok Kaynağı' : 'Kesim Kaynağı';
                      const quantityLabel = isBoru ? 'Verilen Adet (parça)' : 'Kesilen Miktar (parça)';
                      const weightLabel = isBoru ? 'Toplam Satış Kilosu (kg)' : 'Toplam Kesilen Ağırlık (kg)';

                      // Stok ürünü seçiminde gösterilecek bilgileri formatla
                      const formatProductOption = (product) => {
                        let text = `Stok: ${product.stock} | Uzunluk: ${product.length}mm | Ağırlık: ${product.weight ? parseFloat(product.weight).toFixed(2) : '-'}kg`;
                        
                        // product.fields içindeki diğer özellikleri ekle
                        if (product.fields && typeof product.fields === 'object') {
                          const fieldEntries = Object.entries(product.fields)
                            .filter(([key]) => key !== 'length' && key !== 'weight') // length ve weight zaten gösteriliyor
                            .map(([key, value]) => {
                              // Key'i daha okunabilir hale getir
                              const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                              
                              // İç çap alanlarını tespit et (iç çap, iççap, icCap, ic_cap, innerDiameter, inner_diameter vb.)
                              const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                              const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                      normalizedKey.includes('innerdiameter') ||
                                                      normalizedKey.includes('iççap') ||
                                                      normalizedKey === 'icap' ||
                                                      normalizedKey === 'innerdiam';
                              
                              // Eğer iç çap ise ve değer sayısal ise mm ekle
                              let formattedValue = value;
                              if (isInnerDiameter && !isNaN(value) && value !== null && value !== '') {
                                formattedValue = `${value}mm`;
                              }
                              
                              return `${formattedKey}: ${formattedValue}`;
                            });
                          
                          if (fieldEntries.length > 0) {
                            text += ' | ' + fieldEntries.join(' | ');
                          }
                        }
                        
                        return text;
                      };

                      // Tüm ekstra alanları formatla (diameter, length, weight, quantity, productCategoryId, wastageLength, wastageWeight, kgPrice hariç)
                      const excludedFields = ['diameter', 'length', 'weight', 'quantity', 'productCategoryId', 'wastageLength', 'wastageWeight', 'kgPrice'];
                      const formatFieldValue = (key, value) => {
                        // İç çap alanlarını tespit et
                        const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                        const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                normalizedKey.includes('innerdiameter') ||
                                                normalizedKey.includes('iççap') ||
                                                normalizedKey === 'icap' ||
                                                normalizedKey === 'innerdiam';
                        
                        // Eğer iç çap ise ve değer sayısal ise mm ekle
                        if (isInnerDiameter && !isNaN(value) && value !== null && value !== '') {
                          return `${value}mm`;
                        }
                        return value;
                      };
                      
                      const extraFields = Object.entries(item)
                        .filter(([key]) => !excludedFields.includes(key))
                        .map(([key, value]) => {
                          if (value === null || value === undefined || value === '') return null;
                          // Key'i daha okunabilir hale getir
                          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                          const formattedValue = formatFieldValue(key, value);
                          return { key: formattedKey, value: formattedValue };
                        })
                        .filter(field => field !== null);

                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="mb-4 pb-4 border-b border-gray-300">
                            <p className="font-bold text-primary-700 text-lg">{categoryName}</p>
                            <p className="text-sm text-gray-600">Çap: {diameter}mm | Sipariş Miktarı: {quantity} parça</p>
                            {length && <p className="text-xs text-gray-500">Uzunluk: {length}</p>}
                            {weight && <p className="text-xs text-gray-500">Ağırlık: {weight}</p>}
                            {item.kgPrice && (
                              <p className="text-xs text-gray-500">Kilo Fiyatı: {parseFloat(item.kgPrice).toFixed(2)} ₺/kg</p>
                            )}
                            {extraFields.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {extraFields.map((field, fieldIndex) => (
                                  <p key={fieldIndex} className="text-xs text-gray-500">
                                    {field.key}: {field.value}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Selected Products for this item */}
                          <div className="space-y-4">
                            {itemSelectedProducts.map((selectedProduct, productIndex) => (
                              <div key={productIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-700">{sourceLabel} #{productIndex + 1}</h4>
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
                                        onChange={(e) => updateProductData(index, productIndex, 'productId', e.target.value, products)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      >
                                        <option value="">Stok ürünü seçin</option>
                                        {products
                                          .filter(product => {
                                            // Zaten seçilmiş ürünleri filtrele (mevcut seçili ürün hariç)
                                            const isAlreadySelected = itemSelectedProducts.some((sp, idx) => 
                                              idx !== productIndex && sp.productId === product.id
                                            );
                                            return !isAlreadySelected;
                                          })
                                          .map((product) => (
                                            <option key={product.id} value={product.id}>
                                              {formatProductOption(product)}
                                            </option>
                                          ))}
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {quantityLabel}
                                    </label>
                                    <input
                                      type="number"
                                      value={selectedProduct.quantity}
                                      onChange={(e) => updateProductData(index, productIndex, 'quantity', e.target.value, products)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="0"
                                    />
                                  </div>

                                  {/* Dolu ürünleri için kesim uzunluğu: siparişteki uzunluk gösterilir (editlenemez) */}
                                  {isDolu && item.length && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kesim Uzunluğu (mm)
                                      </label>
                                      <input
                                        type="number"
                                        value={item.length}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {weightLabel}
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={selectedProduct.cutWeight}
                                      onChange={(e) => updateProductData(index, productIndex, 'cutWeight', e.target.value, products)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Kilo Fiyatı (₺/kg) <span className="text-gray-500 text-xs">(Sipariş: {item.kgPrice ? parseFloat(item.kgPrice).toFixed(2) : '-'} ₺/kg)</span>
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={selectedProduct.kgPrice || ''}
                                      onChange={(e) => updateProductData(index, productIndex, 'kgPrice', e.target.value, products)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder={item.kgPrice ? parseFloat(item.kgPrice).toFixed(2) : "0.00"}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Product Button */}
                          {(() => {
                            // Toplam adet hesapla
                            const totalQuantity = itemSelectedProducts.reduce((sum, sp) => {
                              return sum + (parseInt(sp.quantity) || 0);
                            }, 0);
                            
                            // Eğer toplam adet sipariş miktarına eşit veya fazlaysa butonu deaktive et
                            const isDisabled = totalQuantity >= quantity;
                            
                            return (
                              <button
                                onClick={() => addProductToItem(index)}
                                type="button"
                                disabled={isDisabled}
                                className={`mt-4 w-full px-4 py-2 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center ${
                                  isDisabled
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                    : 'border-gray-300 text-gray-600 hover:border-primary-500 hover:text-primary-600'
                                }`}
                              >
                                <FiPlus className="mr-2" />
                                Başka Bir Stok Ürünü Ekle
                              </button>
                            );
                          })()}

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

        {/* Status Update Confirmation Modal */}
        <ConfirmationModal
          isOpen={showStatusUpdateModal}
          onClose={() => {
            if (!statusUpdateLoading) {
              setShowStatusUpdateModal(false);
              setPendingStatusUpdate(null);
            }
          }}
          onConfirm={handleConfirmStatusUpdate}
          title="Sipariş Durumu Güncelle"
          message="Bu işlemi gerçekleştirmek istediğinize emin misiniz?"
          confirmText="Onayla"
          cancelText="İptal"
          confirmButtonClass="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={statusUpdateLoading}
        />
    </Layout>
  );
};

export default OrderDetail;

