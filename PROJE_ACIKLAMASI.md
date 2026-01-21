# Yılmazlar Çelik ERP Projesi - Proje Açıklaması

## 📋 Proje Nedir?

Bu proje, **çelik ürünleri** için geliştirilmiş bir **ERP (Kurumsal Kaynak Planlama)** sistemidir. ERP sistemi, bir işletmenin tüm iş süreçlerini (stok, sipariş, satış, istatistikler vb.) tek bir platformda yönetmesini sağlayan yazılımlardır.

### Ne İşe Yarar?

Bu sistem sayesinde:
- **Stok takibi** yapabilirsiniz (hangi ürünlerden ne kadar var?)
- **Sipariş yönetimi** yapabilirsiniz (müşterilerden gelen siparişleri takip edersiniz)
- **İstatistikler** görebilirsiniz (ne kadar satış yapıldı, ne kadar ürün alındı?)
- **Çoklu şube** yönetimi yapabilirsiniz (farklı şubeler kendi verilerini görebilir)
- **Kesim işlemleri** takip edebilirsiniz (ürünlerin kesilmesi, fire miktarları)

---

## 🏗️ Proje Yapısı

Proje **iki ana bölümden** oluşuyor:

### 1. **Backend (Arka Plan - Sunucu Tarafı)**
- **Dil:** Java
- **Framework:** Spring Boot 3.5.7
- **Veritabanı:** MongoDB (NoSQL veritabanı)
- **Güvenlik:** JWT (JSON Web Token) ile kullanıcı doğrulama

**Ne işe yarar?**
- Tüm verileri saklar (ürünler, siparişler, kullanıcılar)
- İş mantığını (business logic) yönetir
- Frontend'e veri sağlar (API üzerinden)

### 2. **Frontend (Ön Yüz - Kullanıcı Arayüzü)**
- **Dil:** JavaScript
- **Framework:** React 18.2.0
- **Build Tool:** Vite
- **Stil:** Tailwind CSS
- **İkonlar:** React Icons

**Ne işe yarar?**
- Kullanıcıların gördüğü arayüzü oluşturur
- Kullanıcı etkileşimlerini (tıklama, form doldurma vb.) yönetir
- Backend'den veri çeker ve gösterir

---

## 🔧 Kullanılan Teknolojiler ve Açıklamaları

### Backend Teknolojileri

#### **Spring Boot**
- Java ile web uygulamaları geliştirmek için kullanılan popüler bir framework
- Hızlı geliştirme sağlar, birçok şeyi otomatik yapar
- REST API'ler oluşturmayı kolaylaştırır

#### **MongoDB**
- Verileri saklamak için kullanılan veritabanı
- NoSQL türünde (geleneksel tablolar yerine doküman tabanlı)
- Esnek yapısı sayesinde farklı türde veriler saklanabilir

#### **Spring Security + JWT**
- **Spring Security:** Uygulamanın güvenliğini sağlar
- **JWT (JSON Web Token):** Kullanıcıların kimlik doğrulaması için kullanılır
  - Kullanıcı giriş yaptığında bir token alır
  - Bu token ile diğer işlemleri yapabilir
  - Token'ın süresi dolduğunda tekrar giriş yapması gerekir

#### **Lombok**
- Java kodunu daha kısa yazmayı sağlar
- Tekrarlayan kodları otomatik oluşturur

### Frontend Teknolojileri

#### **React**
- Kullanıcı arayüzü oluşturmak için kullanılan JavaScript kütüphanesi
- Facebook tarafından geliştirilmiştir
- Bileşen (component) tabanlı çalışır
- Dinamik ve hızlı arayüzler oluşturmayı sağlar

#### **Vite**
- Modern bir build tool (derleme aracı)
- Geliştirme sırasında çok hızlı çalışır
- Projeyi production için hazırlar

#### **Tailwind CSS**
- CSS framework'ü
- Hazır stil sınıfları sağlar
- Hızlı ve tutarlı tasarım yapmayı kolaylaştırır

#### **Axios**
- HTTP istekleri (API çağrıları) yapmak için kullanılır
- Backend ile iletişim kurmayı sağlar

#### **React Router**
- Sayfa yönlendirmelerini (routing) yönetir
- Farklı sayfalar arasında geçiş yapmayı sağlar

---

## 🔌 API Nedir?

**API (Application Programming Interface)** = Uygulama Programlama Arayüzü

### Basit Açıklama:
API, farklı yazılımların birbirleriyle konuşmasını sağlayan bir köprüdür. 

### Bu Projede:
- **Frontend** (React) → Backend'e istek gönderir: "Bana tüm ürünleri göster"
- **Backend** (Spring Boot) → Veritabanından verileri çeker ve Frontend'e gönderir
- **Frontend** → Gelen verileri kullanıcıya gösterir

### Örnek API Endpoint'leri (Bu Projede):

```
GET    /api/stock                    → Tüm ürünleri getir
POST   /api/stock                    → Yeni ürün ekle
GET    /api/orders                   → Tüm siparişleri getir
POST   /api/orders                   → Yeni sipariş oluştur
GET    /api/statistics/purchased     → Satın alma istatistikleri
GET    /api/statistics/sold          → Satış istatistikleri
POST   /api/auth/login               → Kullanıcı girişi
POST   /api/auth/register            → Kullanıcı kaydı
```

**GET:** Veri çekmek için kullanılır  
**POST:** Yeni veri eklemek için kullanılır  
**PUT:** Mevcut veriyi güncellemek için kullanılır  
**DELETE:** Veri silmek için kullanılır

---

## 📊 Proje Özellikleri

### 1. **Kullanıcı Yönetimi**
- **Admin Kullanıcı:** Tüm işlemleri yapabilir, tüm şubeleri görebilir
- **Şube Kullanıcısı:** Sadece kendi şubesine ait verileri görebilir ve yönetebilir
- JWT token ile güvenli giriş sistemi

### 2. **Stok Yönetimi**
- Ürün ekleme, düzenleme, silme
- Ürün kategorileri yönetimi
- Ürün tipleri yönetimi
- Çap (diameter) bazlı ürün arama
- Ürün özellikleri (fields) - esnek yapı

### 3. **Sipariş Yönetimi**
- Sipariş oluşturma
- Sipariş durumu takibi:
  - Oluşturuldu
  - Onaylandı
  - Hazır
  - Çıktı
  - İptal Edildi
- Kesim bilgileri ekleme
- Fire (atık) miktarı takibi

### 4. **İstatistikler**
- **Satın Alma İstatistikleri:**
  - Tarih aralığına göre satın alınan ürünler
  - Toplam satın alma fiyatı
  - Toplam satın alma ağırlığı
  - Toplam satın alma miktarı
  
- **Satış İstatistikleri:**
  - Tarih aralığına göre satılan ürünler
  - Müşteri bazlı satış raporları
  - Toplam satış fiyatı
  - Toplam satış ağırlığı
  - Toplam fire miktarı

### 5. **Şube Yönetimi**
- Çoklu şube desteği
- Her şube kendi kategorilerini yönetebilir
- Şube bazlı veri filtreleme

---

## 🗂️ Veritabanı Yapısı (MongoDB Collections)

### **accounts** (Hesaplar)
- Kullanıcı bilgileri (kullanıcı adı, şifre, rol, şube ID)

### **products** (Ürünler)
- Ürün bilgileri (ağırlık, uzunluk, çap, fiyat, stok, kategori ID)

### **product_categories** (Ürün Kategorileri)
- Ürün kategorileri (her kategori bir şubeye ait)

### **product_types** (Ürün Tipleri)
- Ürün tipleri (örn: demir, çelik boru vb.)

### **orders** (Siparişler)
- Sipariş bilgileri (müşteri, tarih, durum, ürünler, toplam fiyat)

### **branches** (Şubeler)
- Şube bilgileri (şube adı, ID)

---

## 🚀 Proje Nasıl Çalışır?

### Genel Akış:

1. **Kullanıcı Girişi:**
   - Kullanıcı kullanıcı adı ve şifre ile giriş yapar
   - Backend kullanıcıyı doğrular
   - JWT token oluşturulur ve kullanıcıya gönderilir
   - Token localStorage'da saklanır

2. **Veri İsteme:**
   - Frontend, kullanıcı bir sayfaya girdiğinde API'ye istek gönderir
   - İstekte JWT token gönderilir (güvenlik için)
   - Backend token'ı kontrol eder, geçerliyse veriyi gönderir

3. **Veri Gösterme:**
   - Frontend gelen veriyi alır
   - React bileşenleri ile ekranda gösterir

4. **Veri Ekleme/Güncelleme:**
   - Kullanıcı form doldurur
   - Frontend veriyi API'ye gönderir
   - Backend veritabanına kaydeder
   - Başarılı olursa kullanıcıya bildirim gösterilir

---

## 🐳 Docker ile Çalıştırma

Proje Docker ile çalıştırılabilir. Docker, uygulamayı bir "kutu" içinde çalıştırmayı sağlar, böylece her yerde aynı şekilde çalışır.

### Backend Docker:
- `Dockerfile` ile backend uygulaması bir Docker image'ına dönüştürülür
- `docker-compose.yml` ile kolayca çalıştırılabilir

---

## 📁 Proje Klasör Yapısı

### Backend:
```
backend/
├── src/main/java/com/erp/erpproject/
│   ├── controller/      → API endpoint'leri (REST controller'lar)
│   ├── service/         → İş mantığı (business logic)
│   ├── model/           → Veritabanı modelleri (Product, Order vb.)
│   ├── repository/      → Veritabanı işlemleri
│   ├── dto/             → Veri transfer objeleri (API'den gelen/giden veriler)
│   ├── security/        → Güvenlik ayarları (JWT, authentication)
│   └── config/          → Konfigürasyon dosyaları
├── pom.xml              → Maven bağımlılıkları (kullanılan kütüphaneler)
└── Dockerfile           → Docker image oluşturma dosyası
```

### Frontend:
```
frontend/
├── src/
│   ├── pages/           → Sayfalar (Dashboard, Orders, Stock vb.)
│   ├── components/      → Yeniden kullanılabilir bileşenler
│   ├── services/        → API çağrıları (axios ile)
│   ├── context/         → Global state yönetimi (Auth, Notification)
│   ├── utils/           → Yardımcı fonksiyonlar
│   └── App.jsx          → Ana uygulama bileşeni
├── package.json         → NPM bağımlılıkları
└── vite.config.js       → Vite konfigürasyonu
```

---

## 🔐 Güvenlik

### JWT Token Sistemi:
1. Kullanıcı giriş yapar
2. Backend kullanıcıyı doğrular
3. JWT token oluşturulur (kullanıcı bilgileri içerir, şifrelenir)
4. Token kullanıcıya gönderilir
5. Her API isteğinde token gönderilir
6. Backend token'ı kontrol eder, geçerliyse işlemi yapar

### Spring Security:
- Tüm API endpoint'leri korunur
- Sadece giriş yapmış kullanıcılar erişebilir
- Admin işlemleri sadece admin kullanıcılar yapabilir

---

## 📈 İstatistikler Nasıl Çalışır?

### Satın Alma İstatistikleri:
- Belirli bir tarih aralığı seçilir
- O tarihler arasında eklenen ürünler bulunur
- Şube bazında, kategori bazında gruplanır
- Toplam fiyat, ağırlık, miktar hesaplanır

### Satış İstatistikleri:
- Belirli bir tarih aralığı seçilir
- O tarihler arasında verilen siparişler bulunur
- Müşteri bazında, kategori bazında gruplanır
- Toplam satış fiyatı, ağırlık, fire miktarı hesaplanır

---

## 🎯 Projenin Amacı

Bu proje, çelik ürünleri satan bir işletmenin:
- Stoklarını takip etmesini
- Siparişlerini yönetmesini
- Satış ve alış istatistiklerini görmesini
- Çoklu şube yönetimini yapmasını
- Kesim işlemlerini ve fire miktarlarını takip etmesini

sağlamak için geliştirilmiştir.

---

## 💡 Özet

**Backend:** Java + Spring Boot + MongoDB → Verileri saklar, iş mantığını yönetir  
**Frontend:** React + Vite + Tailwind CSS → Kullanıcı arayüzünü oluşturur  
**API:** Backend ve Frontend arasındaki iletişim köprüsü  
**JWT:** Güvenli kullanıcı doğrulama sistemi  
**MongoDB:** Verilerin saklandığı veritabanı  

Bu sistem sayesinde işletme, tüm işlemlerini dijital ortamda yönetebilir, raporlar alabilir ve verimliliğini artırabilir.

---

## 📝 Sunum İçin Önemli Noktalar

1. **Modern Teknolojiler:** Spring Boot, React gibi güncel ve popüler teknolojiler kullanıldı
2. **Güvenlik:** JWT token sistemi ile güvenli bir yapı oluşturuldu
3. **Ölçeklenebilirlik:** Çoklu şube desteği ile büyüyen işletmelere uygun
4. **Kullanıcı Dostu:** Modern ve responsive (mobil uyumlu) arayüz
5. **İstatistikler:** Detaylı raporlama ve analiz imkanı
6. **Docker Desteği:** Kolay kurulum ve dağıtım

---

**Not:** Bu dokümantasyon, yazılım bilgisi olmayan kişiler için hazırlanmıştır. Teknik detaylar basitleştirilerek açıklanmıştır.

