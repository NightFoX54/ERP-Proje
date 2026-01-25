import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { branchService } from '../services/branchService';
import { stockService } from '../services/stockService';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import Loading from '../components/Loading';
import ProductOrderModal from '../components/ProductOrderModal';
import ConfirmationModal from '../components/ConfirmationModal';

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  
  // Product Order Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Branch change confirmation modal state
  const [showBranchChangeModal, setShowBranchChangeModal] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState(null);
  const [branchChangeLoading, setBranchChangeLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProducts();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Kendi şubesini hariç tutarak şubeleri çek
      const branchesData = await branchService.getBranches();
      const filteredBranches = branchesData.filter(b => b.stockEnabled);
      setBranches(filteredBranches || []);

      // Seçili şubenin ürün başlıklarını çek (varsayılan olarak ilk şube)
      if (filteredBranches.length > 0) {
        setSelectedBranch(filteredBranches[0].id);
        await fetchProductCategories(filteredBranches[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
      setLoading(false);
    }
  };

  const fetchProductCategories = async (branchId) => {
    try {
      const data = await stockService.getProductCategories(branchId);
      setProductCategories(data || []);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      toast.error('Ürün başlıkları yüklenirken bir hata oluştu');
    }
  };

  const fetchProductTypes = async () => {
    try {
      const data = await stockService.getProductTypes();
      setProductTypes(data || []);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchCategoryProducts = async () => {
    try {
      const data = await stockService.getProductCategoryById(selectedCategory);
      setCategoryDetails(data.productCategories);
      setCategoryProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching category products:', error);
      toast.error('Ürünler yüklenirken bir hata oluştu');
    }
  };

  const handleBranchChange = (branchId) => {
    // Eğer sepet doluysa ve farklı bir şube seçiliyorsa onay modalı göster
    if (cart.length > 0) {
      setPendingBranchId(branchId);
      setShowBranchChangeModal(true);
      return;
    }
    
    // Sepet boşsa direkt değiştir
    applyBranchChange(branchId);
  };

  const applyBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCart([]); // Sepeti temizle
    await fetchProductCategories(branchId);
  };

  const handleConfirmBranchChange = async () => {
    if (!pendingBranchId) return;

    setBranchChangeLoading(true);
    try {
      await applyBranchChange(pendingBranchId);
      setShowBranchChangeModal(false);
      setPendingBranchId(null);
    } catch (error) {
      console.error('Error changing branch:', error);
      toast.error('Şube değiştirilirken bir hata oluştu');
    } finally {
      setBranchChangeLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const getProductTypeName = (category) => {
    if (!category || !category.productTypeId) return null;
    const productType = productTypes.find(pt => pt.id === category.productTypeId);
    return productType?.name || null;
  };

  // Ürünleri çap ve iç çapa göre sıralama fonksiyonu
  const sortProductsByDiameter = (products) => {
    return [...products].sort((a, b) => {
      // Önce çapa göre sırala
      const diameterA = a.diameter || 0;
      const diameterB = b.diameter || 0;
      
      if (diameterA !== diameterB) {
        return diameterA - diameterB;
      }
      
      // Çaplar eşitse iç çapa göre sırala
      const getInnerDiameter = (product) => {
        if (!product.fields || typeof product.fields !== 'object') return 0;
        
        for (const [key, value] of Object.entries(product.fields)) {
          if (value !== null && value !== undefined && value !== '') {
            const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
            const isInnerDiameter = normalizedKey.includes('iccap') || 
                                    normalizedKey.includes('innerdiameter') ||
                                    normalizedKey.includes('iççap') ||
                                    normalizedKey === 'icap' ||
                                    normalizedKey === 'innerdiam';
            if (isInnerDiameter) {
              const numValue = parseFloat(value);
              return isNaN(numValue) ? 0 : numValue;
            }
          }
        }
        return 0;
      };
      
      const innerDiameterA = getInnerDiameter(a);
      const innerDiameterB = getInnerDiameter(b);
      
      return innerDiameterA - innerDiameterB;
    });
  };

  const addToCart = (product) => {
    // Sepette ürün varsa, mevcut ürünlerin şubesini kontrol et
    if (cart.length > 0) {
      // Sepetteki ilk ürünün branchId'sini al (cart item'ında branchId saklıyoruz)
      const firstItemBranchId = cart[0].branchId;
      
      // Eğer farklı bir şubeden ürün eklenmeye çalışılıyorsa uyarı ver
      if (firstItemBranchId && selectedBranch !== firstItemBranchId) {
        toast.error('Sepette farklı şubeden ürünler var. Önce sepeti temizleyin veya aynı şubeden ürün ekleyin.');
        return;
      }
    }
    
    const productTypeName = getProductTypeName(categoryDetails);
    
    // Eğer ürün tipi "dolu" ise detaylı modal aç
    if (productTypeName && productTypeName.toLowerCase() === 'dolu') {
      setSelectedProduct(product);
      setShowProductModal(true);
      return;
    }
    
    // "boru" veya diğer tipler için direkt sepete ekle
    addProductToCartDirectly(product, 1);
  };

  const addProductToCartDirectly = (product, quantity) => {
    const productTypeName = getProductTypeName(categoryDetails);
    const isBoru = productTypeName?.toLowerCase() === 'boru';
    
    // Boru ürünler için: Aynı productId'ye sahip ürün var mı kontrol et
    if (isBoru) {
      const existingItemIndex = cart.findIndex(item => 
        item.productId === product.id && 
        item.productTypeName?.toLowerCase() === 'boru'
      );
      
      if (existingItemIndex !== -1) {
        // Mevcut ürünün adedini artır
        const existingItem = cart[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Stok kontrolü
        if (product.stock !== undefined) {
          const stock = parseInt(product.stock);
          if (newQuantity > stock) {
            toast.error(`Toplam adet (${newQuantity}) stok miktarını (${stock} adet) geçemez`);
            return;
          }
        }
        
        // Adedi güncelle
        const updatedCart = [...cart];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          orderItem: {
            ...existingItem.orderItem,
            quantity: newQuantity
          }
        };
        setCart(updatedCart);
        toast.success('Sepetteki ürün adedi güncellendi');
        return;
      }
      
      // Yeni ürün ekle - stok kontrolü
      if (product.stock !== undefined) {
        const stock = parseInt(product.stock);
        const requestedQuantity = parseInt(quantity);
        
        if (requestedQuantity > stock) {
          toast.error(`Girilen adet (${requestedQuantity}) stok miktarını (${stock} adet) geçemez`);
          return;
        }
      }
    }
    
    // Boru tipi için direkt sepete ekleme
    const orderItem = {
      productCategoryId: categoryDetails?.id || '',
      diameter: product.diameter || 0,
      length: product.length || null,
      weight: product.weight || null,
      quantity: quantity,
      wastageLength: 0,
      wastageWeight: 0,
    };

    // İç çap bilgisini bul
    let innerDiameter = null;
    if (product.fields) {
      Object.entries(product.fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
          const isInnerDiameter = normalizedKey.includes('iccap') || 
                                  normalizedKey.includes('innerdiameter') ||
                                  normalizedKey.includes('iççap') ||
                                  normalizedKey === 'icap' ||
                                  normalizedKey === 'innerdiam';
          if (isInnerDiameter) {
            innerDiameter = value;
          }
          orderItem[key] = value;
        }
      });
    }

    // Ürün başlığı formatını oluştur
    const formatProductName = () => {
      const parts = [];
      if (product.diameter) {
        parts.push(`Çap: ${product.diameter}mm`);
      }
      if (innerDiameter !== null) {
        parts.push(`İç Çap: ${innerDiameter}mm`);
      }
      if (product.length) {
        parts.push(`Uzunluk: ${product.length}mm`);
      }
      return parts.join(' - ');
    };
    
    // Category name'i bul
    const categoryName = categoryDetails?.name || productCategories.find(cat => cat.id === categoryDetails?.id)?.name || 'Bilinmeyen';
    
    setCart([...cart, {
      orderItem: orderItem,
      productName: formatProductName(),
      categoryName: categoryName, // Ürün başlık adı
      quantity: quantity,
      branchId: selectedBranch, // Şube ID'sini sakla
      kgPrice: '', // Her ürün için ayrı kg fiyatı
      productStock: product.stock, // Stok bilgisini sakla (boru için)
      productLength: product.length, // Ürün uzunluğu (dolu için)
      productId: product.id, // Ürün ID'sini sakla (stok kontrolü için)
      productTypeName: productTypeName, // Ürün tipi (boru/dolu) - stok kontrolü için
    }]);
    
    toast.success('Ürün sepete eklendi');
  };

  const handleProductModalConfirm = (orderItem) => {
    // Sepette ürün varsa, mevcut ürünlerin şubesini kontrol et
    if (cart.length > 0) {
      const firstItemBranchId = cart[0].branchId;
      
      // Eğer farklı bir şubeden ürün eklenmeye çalışılıyorsa uyarı ver
      if (firstItemBranchId && selectedBranch !== firstItemBranchId) {
        toast.error('Sepette farklı şubeden ürünler var. Önce sepeti temizleyin veya aynı şubeden ürün ekleyin.');
        setShowProductModal(false);
        setSelectedProduct(null);
        return;
      }
    }
    
    const productTypeName = getProductTypeName(categoryDetails);
    const isDolu = productTypeName?.toLowerCase() === 'dolu';
    const cutLength = orderItem.length;
    
    // Dolu ürünler için: Aynı productId VE aynı kesim uzunluğu varsa adedi artır
    if (isDolu && selectedProduct?.id && cutLength) {
      const existingItemIndex = cart.findIndex(item => 
        item.productId === selectedProduct.id && 
        item.productTypeName?.toLowerCase() === 'dolu' &&
        item.orderItem?.length === cutLength
      );
      
      if (existingItemIndex !== -1) {
        // Mevcut ürünün adedini artır
        const existingItem = cart[existingItemIndex];
        const newQuantity = existingItem.quantity + orderItem.quantity;
        
        // Stok kontrolü: Aynı productId'ye sahip tüm ürünlerin toplam uzunluğu
        if (selectedProduct?.length !== undefined) {
          const productLength = parseFloat(selectedProduct.length);
          
          // Aynı productId'ye sahip tüm ürünlerin toplam uzunluğunu hesapla
          const sameProductItems = cart.filter(item => 
            item.productId === selectedProduct.id && 
            item.productTypeName?.toLowerCase() === 'dolu' &&
            item.orderItem?.length
          );
          
          let totalLength = 0;
          sameProductItems.forEach(item => {
            totalLength += parseFloat(item.orderItem.length) * item.quantity;
          });
          
          // Yeni eklenen ürünün uzunluğunu da ekle
          totalLength += parseFloat(cutLength) * orderItem.quantity;
          
          if (totalLength > productLength) {
            toast.error(`Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez`);
            return;
          }
        }
        
        // Adedi güncelle
        const updatedCart = [...cart];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          orderItem: {
            ...existingItem.orderItem,
            quantity: newQuantity
          }
        };
        setCart(updatedCart);
        toast.success('Sepetteki ürün adedi güncellendi');
        setShowProductModal(false);
        setSelectedProduct(null);
        return;
      }
      
      // Yeni ürün ekle - stok kontrolü: Aynı productId'ye sahip tüm ürünlerin toplam uzunluğu
      if (selectedProduct?.length !== undefined) {
        const productLength = parseFloat(selectedProduct.length);
        
        // Aynı productId'ye sahip tüm ürünlerin toplam uzunluğunu hesapla
        const sameProductItems = cart.filter(item => 
          item.productId === selectedProduct.id && 
          item.productTypeName?.toLowerCase() === 'dolu' &&
          item.orderItem?.length
        );
        
        let totalLength = 0;
        sameProductItems.forEach(item => {
          totalLength += parseFloat(item.orderItem.length) * item.quantity;
        });
        
        // Yeni eklenen ürünün uzunluğunu da ekle
        totalLength += parseFloat(cutLength) * orderItem.quantity;
        
        if (totalLength > productLength) {
          toast.error(`Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez`);
          return;
        }
      }
    }
    
    // İç çap bilgisini bul
    let innerDiameter = null;
    Object.entries(orderItem).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
        const isInnerDiameter = normalizedKey.includes('iccap') || 
                                normalizedKey.includes('innerdiameter') ||
                                normalizedKey.includes('iççap') ||
                                normalizedKey === 'icap' ||
                                normalizedKey === 'innerdiam';
        if (isInnerDiameter) {
          innerDiameter = value;
        }
      }
    });
    
    // Ürün başlığı formatını oluştur
    const formatProductName = () => {
      const parts = [];
      if (orderItem.diameter) {
        parts.push(`Çap: ${orderItem.diameter}mm`);
      }
      if (innerDiameter !== null) {
        parts.push(`İç Çap: ${innerDiameter}mm`);
      }
      if (orderItem.length) {
        parts.push(`Uzunluk: ${orderItem.length}mm`);
      } else if (orderItem.weight) {
        parts.push(`Ağırlık: ${parseFloat(orderItem.weight).toFixed(2)}kg`);
      }
      return parts.join(' - ');
    };
    
    // Category name'i bul
    const categoryName = categoryDetails?.name || productCategories.find(cat => cat.id === categoryDetails?.id)?.name || 'Bilinmeyen';
    
    setCart([...cart, {
      orderItem: orderItem,
      productName: formatProductName(),
      categoryName: categoryName, // Ürün başlık adı
      quantity: orderItem.quantity,
      branchId: selectedBranch, // Şube ID'sini sakla
      kgPrice: '', // Her ürün için ayrı kg fiyatı
      productStock: selectedProduct?.stock, // Stok bilgisini sakla (boru için)
      productLength: selectedProduct?.length, // Ürün uzunluğu (dolu için)
      productId: selectedProduct?.id, // Ürün ID'sini sakla (stok kontrolü için)
      productTypeName: productTypeName, // Ürün tipi (boru/dolu) - stok kontrolü için
    }]);
    
    setShowProductModal(false);
    setSelectedProduct(null);
    toast.success('Ürün sepete eklendi');
  };

  const updateCartQuantity = (index, change) => {
    const item = cart[index];
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    // Stok kontrolü
    const productTypeName = item.productTypeName;
    const isBoru = productTypeName?.toLowerCase() === 'boru';
    const isDolu = productTypeName?.toLowerCase() === 'dolu';
    
    if (isBoru && item.productStock !== undefined) {
      // Boru için: adet <= stok
      const stock = parseInt(item.productStock);
      if (newQuantity > stock) {
        toast.error(`Girilen adet (${newQuantity}) stok miktarını (${stock} adet) geçemez`);
        return;
      }
    } else if (isDolu && item.orderItem?.length && item.productLength !== undefined && item.productId) {
      // Dolu için: Aynı productId'ye sahip tüm ürünlerin toplam uzunluğu <= ürün uzunluğu
      const productLength = parseFloat(item.productLength);
      const currentItemLength = parseFloat(item.orderItem.length);
      
      // Aynı productId'ye sahip tüm ürünlerin toplam uzunluğunu hesapla
      const sameProductItems = cart.filter(cartItem => 
        cartItem.productId === item.productId && 
        cartItem.productTypeName?.toLowerCase() === 'dolu' &&
        cartItem.orderItem?.length
      );
      
      let totalLength = 0;
      sameProductItems.forEach(cartItem => {
        if (cartItem === item) {
          // Güncellenen ürün için yeni adet kullan
          totalLength += parseFloat(cartItem.orderItem.length) * newQuantity;
        } else {
          // Diğer ürünler için mevcut adet kullan
          totalLength += parseFloat(cartItem.orderItem.length) * cartItem.quantity;
        }
      });
      
      if (totalLength > productLength) {
        toast.error(`Toplam uzunluk (${totalLength}mm) ürün uzunluğunu (${productLength}mm) geçemez`);
        return;
      }
    }
    
    setCart(cart.map((cartItem, idx) => {
      if (idx === index) {
        const updatedItem = { ...cartItem, quantity: newQuantity };
        if (updatedItem.orderItem) {
          updatedItem.orderItem.quantity = newQuantity;
        }
        return updatedItem;
      }
      return cartItem;
    }));
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
    toast.success('Ürün sepetten çıkarıldı');
  };

  const updateCartKgPrice = (index, kgPrice) => {
    setCart(cart.map((item, idx) => {
      if (idx === index) {
        return { ...item, kgPrice: kgPrice };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedBranch) {
      toast.error('Lütfen bir şube seçiniz');
      return;
    }

    if (cart.length === 0) {
      toast.error('Sepetiniz boş');
      return;
    }

    try {
      setSubmitting(true);
      
      if (!customerName || customerName.trim() === '') {
        toast.error('Lütfen müşteri firma ismini giriniz');
        return;
      }

      // Her ürün için kg fiyatı kontrolü
      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        if (!item.kgPrice || item.kgPrice.trim() === '' || parseFloat(item.kgPrice) <= 0) {
          toast.error(`Lütfen "${item.productName}" ürünü için kilogram fiyatını giriniz`);
          return;
        }
      }

      // Toplam fire hesapla (her zaman 0 olacak çünkü sipariş oluştururken girilmiyor)
      const totalWastageLength = 0;
      const totalWastageWeight = 0;

      // Her orderItem'a kgPrice ekle
      const orderItems = cart.map(item => ({
        ...item.orderItem,
        kgPrice: parseFloat(item.kgPrice),
      }));

      const orderData = {
        customerName: customerName.trim(),
        orderGivenBranchId: user?.branchId,
        orderDeliveryBranchId: selectedBranch,
        orderGivenDate: new Date().toISOString(),
        orderDeliveryDate: null,
        orderStatus: 'Oluşturuldu',
        orderItems: orderItems,
        totalWastageWeight: totalWastageWeight,
        totalWastageLength: totalWastageLength,
      };

      await orderService.createOrder(orderData);
      
      toast.success('Sipariş başarıyla oluşturuldu!');
      
      // Formu temizle
      setCart([]);
      setCustomerName('');
      
      // Siparişler sayfasına yönlendir
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Sipariş oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };


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
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Siparişlere Dön
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Yeni Sipariş Oluştur</h1>
          <p className="text-gray-600">
            Şubeler arası sipariş oluşturun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Name */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Firma İsmi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
                placeholder="Örn: ABC İnşaat Ltd. Şti."
                required
              />
            </div>

            {/* Branch Selection */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sipariş Verilecek Şube <span className="text-red-500">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Şube Seçiniz</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Categories */}
            {selectedBranch && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ürün Başlıkları</h2>
                
                {productCategories.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Bu şubede henüz ürün başlığı bulunmuyor
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {productCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 font-semibold ${
                          selectedCategory === category.id
                            ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 shadow-lg shadow-primary-500/20 transform scale-105'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-pastel-lightBlue/30 text-gray-700 hover:shadow-md'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Products */}
            {selectedCategory && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ürünler</h2>
                
                {categoryProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Bu başlıkta henüz ürün bulunmuyor
                  </p>
                ) : (
                  <div className="space-y-3">
                        {sortProductsByDiameter(categoryProducts)
                      .filter(product => product.stock > 0)
                      .map((product) => {
                        // Tüm ekstra alanları formatla (diameter, length, weight, stock hariç)
                        const excludedFields = ['diameter', 'length', 'weight', 'stock', 'id', 'productCategoryId', 'purchasePrice', 'kgPrice', 'isActive', 'createdAt'];
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
                        
                        // İç çap bilgisini bul
                        let innerDiameter = null;
                        if (product.fields && typeof product.fields === 'object') {
                          Object.entries(product.fields).forEach(([key, value]) => {
                            if (value !== null && value !== undefined && value !== '') {
                              const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                              const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                      normalizedKey.includes('innerdiameter') ||
                                                      normalizedKey.includes('iççap') ||
                                                      normalizedKey === 'icap' ||
                                                      normalizedKey === 'innerdiam';
                              if (isInnerDiameter) {
                                innerDiameter = value;
                              }
                            }
                          });
                        }
                        
                        // Ürün başlığı formatını oluştur
                        const formatProductTitle = () => {
                          const parts = [];
                          if (product.diameter) {
                            parts.push(`Çap: ${product.diameter}mm`);
                          }
                          if (innerDiameter !== null) {
                            parts.push(`İç Çap: ${innerDiameter}mm`);
                          }
                          if (product.length) {
                            parts.push(`Uzunluk: ${product.length}mm`);
                          }
                          return parts.join(' - ');
                        };
                        
                        const extraFields = [];
                        // product.fields içindeki alanları ekle (iç çap hariç, çünkü zaten başlıkta gösteriliyor)
                        if (product.fields && typeof product.fields === 'object') {
                          Object.entries(product.fields).forEach(([key, value]) => {
                            if (value !== null && value !== undefined && value !== '') {
                              const normalizedKey = key.toLowerCase().replace(/[_\s]/g, '');
                              const isInnerDiameter = normalizedKey.includes('iccap') || 
                                                      normalizedKey.includes('innerdiameter') ||
                                                      normalizedKey.includes('iççap') ||
                                                      normalizedKey === 'icap' ||
                                                      normalizedKey === 'innerdiam';
                              // İç çap alanını atla, çünkü zaten başlıkta gösteriliyor
                              if (!isInnerDiameter) {
                                const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                                const formattedValue = formatFieldValue(key, value);
                                extraFields.push({ key: formattedKey, value: formattedValue });
                              }
                            }
                          });
                        }
                        
                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-1">
                                {formatProductTitle()}
                              </p>
                              <p className="text-sm text-gray-600">
                                Ağırlık: {product.weight ? parseFloat(product.weight).toFixed(2) : '-'}kg | Stok: <span className="font-semibold text-green-600">{product.stock}</span>
                              </p>
                              {extraFields.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {extraFields.map((field, index) => (
                                    <span key={index}>
                                      {index > 0 && ' | '}
                                      {field.key}: {field.value}
                                    </span>
                                  ))}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => addToCart(product)}
                              className="btn-primary flex items-center ml-4 whitespace-nowrap"
                            >
                              <FiPlus className="mr-2" />
                              Sepete Ekle
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4 shadow-strong border-2 border-primary-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mr-3">
                  <FiShoppingCart className="text-primary-700" />
                </div>
                Sepet ({cart.length})
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiShoppingCart className="mx-auto text-4xl mb-2 opacity-50" />
                  <p>Sepetiniz boş</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                    {cart.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            {item.categoryName && (
                              <p className="text-sm font-bold text-primary-700 mb-2 px-2 py-1 bg-primary-50 rounded-md border border-primary-200 inline-block">
                                {item.categoryName}
                              </p>
                            )}
                            <p className="text-sm font-semibold text-gray-900">
                              {item.productName}
                            </p>
                            {item.orderItem && (() => {
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
                              
                              const extraFields = Object.entries(item.orderItem)
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
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.orderItem.diameter && `Çap: ${item.orderItem.diameter}mm`}
                                  {item.orderItem.length && ` | Uzunluk: ${item.orderItem.length}mm`}
                                  {item.orderItem.weight && ` | Ağırlık: ${parseFloat(item.orderItem.weight).toFixed(2)}kg`}
                                  {extraFields.length > 0 && (
                                    <>
                                      {extraFields.map((field, fieldIndex) => (
                                        <span key={fieldIndex}>
                                          {' | '}
                                          {field.key}: {field.value}
                                        </span>
                                      ))}
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all ml-2"
                            title="Sepetten Çıkar"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateCartQuantity(index, -1)}
                                className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all"
                              >
                                <FiMinus className="text-xs" />
                              </button>
                              <span className="text-sm font-bold w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(index, 1)}
                                className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all"
                              >
                                <FiPlus className="text-xs" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Kg Fiyatı (₺) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.kgPrice || ''}
                              onChange={(e) => updateCartKgPrice(index, e.target.value)}
                              className="input-field w-full text-sm"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !selectedBranch}
                      className="btn-primary w-full py-3"
                    >
                      {submitting ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Order Modal */}
        {showProductModal && selectedProduct && categoryDetails && (
          <ProductOrderModal
            isOpen={showProductModal}
            onClose={() => {
              setShowProductModal(false);
              setSelectedProduct(null);
            }}
            onConfirm={handleProductModalConfirm}
            product={selectedProduct}
            category={categoryDetails}
          />
        )}
      </div>

        {/* Branch Change Confirmation Modal */}
        <ConfirmationModal
          isOpen={showBranchChangeModal}
          onClose={() => {
            if (!branchChangeLoading) {
              setShowBranchChangeModal(false);
              setPendingBranchId(null);
            }
          }}
          onConfirm={handleConfirmBranchChange}
          title="Şube Değiştir"
          message="Şube değiştirildiğinde sepet temizlenecektir. Devam etmek istiyor musunuz?"
          confirmText="Devam Et"
          cancelText="İptal"
          confirmButtonClass="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={branchChangeLoading}
        />
    </Layout>
  );
};

export default CreateOrder;

