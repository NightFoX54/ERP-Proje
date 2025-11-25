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

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
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
      const filteredBranches = branchesData.filter(b => b.id !== user?.branchId && b.stockEnabled);
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

  const fetchCategoryProducts = async () => {
    try {
      const data = await stockService.getProductCategoryById(selectedCategory);
      setCategoryProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching category products:', error);
      toast.error('Ürünler yüklenirken bir hata oluştu');
    }
  };

  const handleBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    setSelectedCategory(null);
    setCategoryProducts([]);
    await fetchProductCategories(branchId);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: `${product.diameter || ''}mm - ${product.length || ''}m`,
        quantity: 1,
        unitPrice: product.purchasePrice || 0,
        product: product,
      }]);
    }
    
    toast.success('Ürün sepete eklendi');
  };

  const updateCartQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
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
      
      const orderData = {
        fromBranchId: user?.branchId,
        toBranchId: selectedBranch,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        status: 'PENDING',
      };

      // TODO: Backend endpoint hazır olduğunda açılacak
      // await orderService.createOrder(orderData);
      
      toast.success('Sipariş başarıyla oluşturuldu!');
      
      // Sepeti temizle
      orderService.clearCart();
      setCart([]);
      
      // Siparişler sayfasına yönlendir
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Sipariş oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
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
                              Ağırlık: {product.weight}kg | Stok: <span className="font-semibold text-green-600">{product.stock}</span> | Fiyat: <span className="font-semibold text-primary-600">{product.purchasePrice?.toFixed(2) || '0.00'} ₺</span>
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
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition-all duration-200 bg-gray-50/50 hover:bg-white"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-sm font-semibold text-gray-900 flex-1">
                            {item.productName}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all ml-2"
                            title="Sepetten Çıkar"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(item.productId, -1)}
                              className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all"
                            >
                              <FiMinus className="text-xs" />
                            </button>
                            <span className="text-sm font-bold w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.productId, 1)}
                              className="p-1.5 rounded-lg border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all"
                            >
                              <FiPlus className="text-xs" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-primary-700">
                            {(item.quantity * item.unitPrice).toFixed(2)} ₺
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-900">Toplam:</span>
                      <span className="text-xl font-bold text-primary-700">
                        {getTotalPrice().toFixed(2)} ₺
                      </span>
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
      </div>
    </Layout>
  );
};

export default CreateOrder;

