# Yılmazlar Çelik Frontend

React tabanlı frontend uygulaması.

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
npm install
```

### Development

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

### Build

```bash
npm run build
```

Build çıktısı `dist` klasöründe oluşturulacaktır.

### Preview

```bash
npm run preview
```

Production build'i preview için çalıştırır.

## 📁 Klasör Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── Layout.jsx      # Ana layout bileşeni (navbar, sidebar)
│   ├── Loading.jsx     # Loading spinner
│   ├── ProtectedRoute.jsx  # Route koruma bileşeni
│   ├── ProductModal.jsx    # Ürün ekleme/düzenleme modalı
│   └── ProductCategoryModal.jsx  # Ürün başlığı ekleme modalı
├── context/            # React Context API
│   ├── AuthContext.jsx      # Authentication context
│   └── NotificationContext.jsx  # Bildirim context'i
├── pages/              # Sayfa bileşenleri
│   ├── Login.jsx           # Giriş sayfası
│   ├── Dashboard.jsx       # Ana sayfa
│   ├── AdminPanel.jsx      # Admin paneli
│   ├── StockManagement.jsx # Stok yönetimi
│   ├── Orders.jsx          # Sipariş listesi
│   ├── CreateOrder.jsx     # Yeni sipariş oluşturma
│   └── OrderDetail.jsx     # Sipariş detay sayfası
├── services/           # API servisleri
│   ├── authService.js      # Authentication API
│   ├── branchService.js    # Şube API
│   ├── stockService.js     # Stok API
│   └── orderService.js     # Sipariş API
├── utils/              # Yardımcı fonksiyonlar
│   └── api.js             # Axios konfigürasyonu
├── App.jsx             # Ana uygulama bileşeni
├── main.jsx            # Entry point
└── index.css           # Global stiller
```

## 🔧 Yapılandırma

### Environment Variables

`.env` dosyası oluşturun:

```env
VITE_API_URL=http://localhost:8080
```

### API Konfigürasyonu

API base URL'i `src/utils/api.js` dosyasında yapılandırılmıştır. JWT token'lar otomatik olarak tüm isteklere eklenir.

## 🎨 Stil ve Tema

- **Tailwind CSS** kullanılmıştır
- Pastel mavi ve beyaz renk paleti
- Responsive tasarım (mobil öncelikli)
- Custom CSS sınıfları `index.css` dosyasında tanımlanmıştır

## 📱 Özellikler

- ✅ JWT tabanlı authentication
- ✅ Protected routes
- ✅ Admin paneli
- ✅ Stok yönetimi
- ✅ Sipariş yönetimi
- ✅ Bildirim sistemi
- ✅ Responsive tasarım

## 🔐 Authentication

Sistem JWT token tabanlı authentication kullanır. Token'lar localStorage'da saklanır ve otomatik olarak API isteklerine eklenir.

## 🧪 Test

```bash
npm test
```

## 📦 Build ve Deploy

### Production Build

```bash
npm run build
```

### Deploy

Build çıktısını (`dist` klasörü) statik bir web sunucusuna deploy edebilirsiniz.

## 🐛 Sorun Giderme

### API Bağlantı Hataları

1. Backend'in çalıştığından emin olun
2. `.env` dosyasındaki `VITE_API_URL` değerini kontrol edin
3. CORS ayarlarını kontrol edin

### Token Sorunları

Token'lar localStorage'da saklanır. Çıkış yapıp tekrar giriş yapmayı deneyin.

## 📝 Notlar

- Backend'de henüz hazır olmayan endpoint'ler için placeholder'lar kullanılmıştır
- Sipariş oluşturma backend endpoint'i hazır olduğunda aktif edilecektir
- WebSocket entegrasyonu bildirimler için planlanmıştır

