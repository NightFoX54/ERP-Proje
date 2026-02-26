# Envanter Metrikleri – Matematiksel Formüller

Bu dokümanda **InventoryMetricsService** içinde kullanılan tüm hesaplamalar matematiksel formül olarak verilmiştir. Kod referansı değil, doğrulama için formüller yazılmıştır.

---

## 1. Talep toplama (Demand aggregation)

**Veri kaynağı:** Son 365 gün, sipariş durumu **Hazır** veya **Çıktı** olan siparişler.

### 1.1 Net satış ağırlığı (her satır için)

\[
\text{Net satış (kg)} = \text{totalSoldWeight} - \text{wastageWeight}
\]

(wastage yoksa 0 alınır.)

### 1.2 Analytics key bazında toplam satış

Her **analyticsKey** için, o key’e bağlı ürünlerin satışları toplanır:

\[
\text{Toplam satış (kg)} = \sum_{\text{ilgili sipariş satırları}} \text{Net satış}
\]

### 1.3 Gün sayısı

\[
\text{Gün sayısı} = \frac{\text{Bugün} - \text{İlk satış tarihi}}{\text{1 gün}} \quad \text{(en az 1)}
\]

(İlk satış tarihi: o analyticsKey için satış yapılan en erken sipariş tarihi.)

### 1.4 Ortalama günlük talep

\[
\text{Ortalama günlük talep } d = \frac{\text{Toplam satış (kg)}}{\text{Gün sayısı}} \quad [\text{kg/gün}]
\]

### 1.5 Yıllık talep

\[
\text{Yıllık talep } D = d \times 365 \quad [\text{kg/yıl}]
\]

---

## 2. Ortalama kg fiyatı (Avg kg price)

Aynı **analyticsKey**’e sahip tüm ürünlerin kg fiyatlarının ortalaması:

\[
\text{Ortalama kg fiyatı } p = \frac{1}{n} \sum_{i=1}^{n} (\text{kg fiyatı})_i \quad [\text{TL/kg}]
\]

\(n\) = o analyticsKey’e sahip ürün sayısı.

---

## 3. EOQ (Economic Order Quantity – Ekonomik sipariş miktarı)

**Kodda kullanılan formül (birebir):**

\[
\text{EOQ} = \sqrt{ \frac{2 \cdot D \cdot S}{h \cdot d} } \quad [\text{kg}]
\]

**Parametreler:**
- \(D\) = Yıllık talep [kg/yıl]
- \(S\) = Sipariş maliyeti (defaultOrderingCost) [TL/sipariş]
- \(h\) = Elde tutma oranı (holdingRate, örn. 0,20)
- \(d\) = Ortalama günlük talep [kg/gün]

**Not:** Klasik EOQ formülü genelde \(\text{EOQ} = \sqrt{2DS/H}\) şeklinde yazılır; \(H\) = birim başına yıllık elde tutma maliyeti [TL/(kg·yıl)]. Bu projede payda \(h \cdot d\) kullanılıyor. Doğrulama yaparken bu farkı kontrol etmek faydalı olur.

---

## 4. Yeniden sipariş noktası (Reorder point)

\[
\text{Yeniden sipariş noktası (ROP)} = d \times L \quad [\text{kg}]
\]

- \(d\) = Ortalama günlük talep [kg/gün]
- \(L\) = Teslimat süresi / sipariş öncesi gün (reorderDays, örn. 14) [gün]

Yani: “\(L\) gün boyunca ortalama ne kadar talep gelir?” cevabı ROP olarak kullanılıyor.

---

## 5. Yıllık değer (Annual value)

\[
\text{Yıllık değer} = p \times D \quad [\text{TL/yıl}]
\]

- \(p\) = Ortalama kg fiyatı [TL/kg]
- \(D\) = Yıllık talep [kg/yıl]

---

## 6. Stok miktarı – kg (Stock kg)

Aynı **analyticsKey**’e sahip tüm ürünlerin (stoktaki ağırlık) toplamı:

\[
\text{Stok (kg)} = \sum_{\text{o analyticsKey’e ait ürünler}} (\text{weight})_i \quad [\text{kg}]
\]

---

## 7. ABC sınıflandırması

1. Tüm metrikler **yıllık değer**e göre **büyükten küçüğe** sıralanır.
2. Toplam değer hesaplanır:
   \[
   V_{\text{toplam}} = \sum_{\text{tüm metrikler}} \text{Yıllık değer}
   \]
3. Her metrik için kümülatif oran:
   \[
   \text{Kümülatif} \leftarrow \text{Kümülatif} + \text{Yıllık değer}
   \]
   \[
   \text{Oran} = \frac{\text{Kümülatif}}{V_{\text{toplam}}}
   \]
4. Sınıf ataması:
   - Oran \(\leq 0{,}70\) → **A**
   - \(0{,}70 <\) Oran \(\leq 0{,}90\) → **B**
   - Oran \(> 0{,}90\) → **C**

Yani değer sıralamasında en üstteki %70’lik kümülatif pay “A”, sonraki %20’lik dilim “B”, kalan %10 “C” olur.

---

## Konfigürasyon (varsayılan – InventoryConfig)

| Parametre | Açıklama | Örnek |
|-----------|----------|--------|
| defaultOrderingCost (\(S\)) | Sipariş başına maliyet [TL] | 1000 |
| holdingRate (\(h\)) | Elde tutma oranı | 0,20 |
| reorderDays (\(L\)) | Teslimat / sipariş öncesi gün sayısı | 14 |

---

## Hesaplama sırası (calculate-all akışı)

1. Initialize (eksik metrik kayıtları oluşturulur, gereksizler silinir)
2. Talep toplama → **avgDailyDemand**, **annualDemand**
3. Ortalama kg fiyatı atanır → **avgKgPrice**
4. Her metrik için: **EOQ**, **Reorder point**, **Annual value**, **Stock kg**
5. ABC sınıflandırması → **abcClass**

Bu sıra, formüllerin birbirine bağımlılığıyla uyumludur (ör. annual value, ABC için önce annual demand ve avg kg price gerekir).
