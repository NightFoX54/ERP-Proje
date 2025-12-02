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
  const [totalPrice, setTotalPrice] = useState(0);
  const [customerName, setCustomerName] = useState('');
  
  // Product Order Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleBranchChange = async (branchId) => {
    // Eğer sepet doluysa ve farklı bir şube seçiliyorsa uyarı ver
    if (cart.length > 0) {
      if (!window.confirm('Şube değiştirildiğinde sepet temizlenecektir. Devam etmek istiyor musunuz?')) {
        return;
      }
    }
    
    setSelectedBranch(branchId);
    setSelectedCategory(null);
    setCategoryProducts([]);
    setCart([]); // Sepeti temizle
    await fetchProductCategories(branchId);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const getProductTypeName = (category) => {
    if (!category || !category.productTypeId) return null;
    const productType = productTypes.find(pt => pt.id === category.productTypeId);
    return productType?.name || null;
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

    // Extra fields varsa ekle
    if (product.fields) {
      Object.entries(product.fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          orderItem[key] = value;
        }
      });
    }

    setCart([...cart, {
      orderItem: orderItem,
      productName: `${product.diameter || ''}mm - ${product.length || ''}mm`,
      quantity: quantity,
      branchId: selectedBranch, // Şube ID'sini sakla
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
    
    setCart([...cart, {
      orderItem: orderItem,
      productName: `${orderItem.diameter || ''}mm - ${orderItem.length ? orderItem.length + 'mm' : orderItem.weight ? parseFloat(orderItem.weight).toFixed(2) + 'kg' : ''}`,
      quantity: orderItem.quantity,
      branchId: selectedBranch, // Şube ID'sini sakla
    }]);
    
    setShowProductModal(false);
    setSelectedProduct(null);
    toast.success('Ürün sepete eklendi');
  };

  const updateCartQuantity = (index, change) => {
    setCart(cart.map((item, idx) => {
      if (idx === index) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null;
        }
        const updatedItem = { ...item, quantity: newQuantity };
        if (updatedItem.orderItem) {
          updatedItem.orderItem.quantity = newQuantity;
        }
        return updatedItem;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, idx) => idx !== index));
    toast.success('Ürün sepetten çıkarıldı');
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

      if (!totalPrice || totalPrice <= 0) {
        toast.error('Lütfen toplam fiyatı giriniz');
        return;
      }

      // Toplam fire hesapla (her zaman 0 olacak çünkü sipariş oluştururken girilmiyor)
      const totalWastageLength = 0;
      const totalWastageWeight = 0;

      const orderData = {
        customerName: customerName.trim(),
        orderGivenBranchId: user?.branchId,
        orderDeliveryBranchId: selectedBranch,
        orderGivenDate: new Date().toISOString(),
        orderDeliveryDate: null,
        orderStatus: 'Oluşturuldu',
        orderItems: cart.map(item => item.orderItem),
        totalPrice: parseFloat(totalPrice),
        totalWastageWeight: totalWastageWeight,
        totalWastageLength: totalWastageLength,
      };

      await orderService.createOrder(orderData);
      
      toast.success('Sipariş başarıyla oluşturuldu!');
      
      // Formu temizle
      setCart([]);
      setCustomerName('');
      setTotalPrice(0);
      
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
                        {categoryProducts
                      .filter(product => product.stock > 0)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">
                              {product.diameter ? `${product.diameter}mm` : ''} - {product.length ? `${product.length}m` : ''}
                            </p>
                            <p className="text-sm text-gray-600">
                              Ağırlık: {product.weight ? parseFloat(product.weight).toFixed(2) : '-'}kg | Stok: <span className="font-semibold text-green-600">{product.stock}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="btn-primary flex items-center ml-4 whitespace-nowrap"
                          >
                            <FiPlus className="mr-2" />
                            Sepete Ekle
                          </button>
                        </div>
                      ))}
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
                            <p className="text-sm font-semibold text-gray-900">
                              {item.productName}
                            </p>
                            {item.orderItem && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.orderItem.diameter && `Çap: ${item.orderItem.diameter}mm`}
                                {item.orderItem.length && ` | Uzunluk: ${item.orderItem.length}mm`}
                                {item.orderItem.weight && ` | Ağırlık: ${parseFloat(item.orderItem.weight).toFixed(2)}kg`}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all ml-2"
                            title="Sepetten Çıkar"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
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
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Toplam Fiyat (₺) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(e.target.value)}
                        className="input-field w-full text-lg font-bold"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        required
                      />
                    </div>

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
    </Layout>
  );
};

export default CreateOrder;

