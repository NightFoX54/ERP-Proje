package com.erp.erpproject.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

import com.erp.erpproject.model.InventoryConfig;
import com.erp.erpproject.model.InventoryMetrics;
import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.repository.InventoryConfigRepository;
import com.erp.erpproject.repository.InventoryMetricsRepository;
import com.erp.erpproject.repository.OrdersRepository;
import com.erp.erpproject.repository.ProductRepository;

@Slf4j
@Service
public class InventoryMetricsService {
    private final InventoryMetricsRepository inventoryMetricsRepository;
    private final ProductRepository productRepository;
    private final OrdersRepository ordersRepository;
    private final InventoryConfigRepository inventoryConfigRepository;

    public InventoryMetricsService(InventoryMetricsRepository inventoryMetricsRepository,
            ProductRepository productRepository,
            OrdersRepository ordersRepository,
            InventoryConfigRepository inventoryConfigRepository) {
        this.inventoryMetricsRepository = inventoryMetricsRepository;
        this.productRepository = productRepository;
        this.ordersRepository = ordersRepository;
        this.inventoryConfigRepository = inventoryConfigRepository;
    }

    public List<InventoryMetrics> getAll() {
        return inventoryMetricsRepository.findAll();
    }

    public ResponseEntity<InventoryMetrics> createInventoryMetrics(InventoryMetrics inventoryMetrics) {
        return ResponseEntity.ok(inventoryMetricsRepository.save(inventoryMetrics));
    }

    public ResponseEntity<Void> initializeInventoryMetrics(){
        List<InventoryConfig> inventoryConfigs = inventoryConfigRepository.findAll();
        InventoryConfig inventoryConfig = null;
        if(inventoryConfigs.isEmpty()){
            inventoryConfig = new InventoryConfig();
            inventoryConfig.setDefaultOrderingCost(1000.0);
            inventoryConfig.setHoldingRate(0.20);
            inventoryConfig.setReorderDays(14);
            inventoryConfigRepository.save(inventoryConfig);
        }else{
            inventoryConfig = inventoryConfigs.get(0);
        }
        List<Product> products = productRepository.findAll();

        // N+1 önleme: mevcut tüm analyticsKey'leri tek sorguda çek
        Set<String> existingMetricsKeys = inventoryMetricsRepository.findAll().stream()
            .map(InventoryMetrics::getAnalyticsKey)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        List<Product> productsToSave = new java.util.ArrayList<>();
        List<InventoryMetrics> metricsToSave = new java.util.ArrayList<>();

        for(Product product : products){
            if(product.getAnalyticsKey() == null){
                if (product.getDiameter() == null) {
                    log.warn(
                            "initializeInventoryMetrics: ürün atlandı (analyticsKey üretilemez, diameter null) productId={}",
                            product.getId());
                    continue;
                }
                String innerDiameter = null;
                java.util.Map<String, Object> fields = product.getFields();
                if (fields != null && fields.containsKey("iç çap") && fields.get("iç çap") != null) {
                    innerDiameter = fields.get("iç çap").toString();
                }
                product.setAnalyticsKey(product.getProductCategoryId() + "-" + product.getDiameter().toString() + "-" + innerDiameter);
                productsToSave.add(product);
            }
            if(existingMetricsKeys.contains(product.getAnalyticsKey())){
                continue;
            }
            existingMetricsKeys.add(product.getAnalyticsKey());
            InventoryMetrics inventoryMetrics = new InventoryMetrics();
            inventoryMetrics.setAnalyticsKey(product.getAnalyticsKey());
            inventoryMetrics.setProductCategoryId(product.getProductCategoryId());
            inventoryMetrics.setDiameter(product.getDiameter());
            java.util.Map<String, Object> pf = product.getFields();
            if(pf != null && pf.containsKey("iç çap") && pf.get("iç çap") != null){
                inventoryMetrics.setInnerDiameter(Double.parseDouble(pf.get("iç çap").toString()));
            }
            inventoryMetrics.setEoq(0.0);
            inventoryMetrics.setReorderPoint(0.0);
            inventoryMetrics.setAbcClass("A");
            inventoryMetrics.setAnnualDemand(0.0);
            inventoryMetrics.setAvgDailyDemand(0.0);    
            inventoryMetrics.setLastCalculatedAt(new Date());
            inventoryMetrics.setStockKg(0.0);
            metricsToSave.add(inventoryMetrics);
        }

        productRepository.saveAll(productsToSave);
        inventoryMetricsRepository.saveAll(metricsToSave);
        return ResponseEntity.ok(null);
    }
    private Map<String, Double> getAvgKgPriceMapByAnalyticsKey() {
        return productRepository.findAll().stream()
            .filter(p -> p.getAnalyticsKey() != null && p.getKgPrice() != null)
            .collect(java.util.stream.Collectors.groupingBy(
                Product::getAnalyticsKey,
                java.util.stream.Collectors.averagingDouble(Product::getKgPrice)
            ));
    }

    private ResponseEntity<Void> setAvgKgPriceToInventoryMetrics() {
        Map<String, Double> avgKgPriceMapByAnalyticsKey = getAvgKgPriceMapByAnalyticsKey();
        List<InventoryMetrics> allMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : allMetrics) {
            inventoryMetric.setAvgKgPrice(avgKgPriceMapByAnalyticsKey.get(inventoryMetric.getAnalyticsKey()));
        }
        inventoryMetricsRepository.saveAll(allMetrics);
        return ResponseEntity.ok(null);
    }
    /**
     * Demand aggregation pipeline: soldItems.productId → Product → analyticsKey
     * Sadece Hazır ve Çıktı durumundaki siparişler dahil edilir.
     * group by analyticsKey, sum(totalSoldWeight), dailyDemand = totalSales / days, annualDemand = dailyDemand * 365
     */
    public ResponseEntity<Void> calculateDemandAggregation() {
        try {
            return calculateDemandAggregationInternal();
        } catch (Exception e) {
            log.error("calculateDemandAggregation: beklenmeyen hata — {}", e.getMessage(), e);
            throw e;
        }
    }

    private ResponseEntity<Void> calculateDemandAggregationInternal() {
        List<OrderStatus> includedStatuses = List.of(OrderStatus.Hazır, OrderStatus.Çıktı);
        List<Orders> orders = ordersRepository.findAllByOrderStatusInAndOrderGivenDateAfter(includedStatuses, Date.from(Instant.now().minus(365, ChronoUnit.DAYS)));

        // analyticsKey -> { totalSales, firstSaleDate }
        Map<String, DemandAggregationData> aggregationMap = new java.util.HashMap<>();
        Map<String, Product> productMap =
            productRepository.findAll().stream()
            .filter(p -> p.getId() != null)
            .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p, (a, b) -> b));

        

        Date today = new Date();

        for (Orders order : orders) {
            if (order.getSoldItems() == null || order.getOrderGivenDate() == null) {
                continue;
            }

            for (Map<String, Object> soldItem : order.getSoldItems()) {
                Object productIdObj = soldItem.get("productId");
                Object totalSoldWeightObj = soldItem.get("totalSoldWeight");
                Object wastageWeightObj = soldItem.get("wastageWeight");

                if (productIdObj == null || totalSoldWeightObj == null) {
                    continue;
                }

                String productId = productIdObj.toString();
                Double totalSoldWeight = toDouble(totalSoldWeightObj);
                Double wastageWeight = toDouble(wastageWeightObj);
                Double netSoldWeight = totalSoldWeight - (wastageWeight != null ? wastageWeight : 0.0);

                Product product = productMap.get(productId);
                if (product == null) {
                    continue;
                }

                String analyticsKey = resolveAnalyticsKey(product);
                if (analyticsKey == null) {
                    continue;
                }

                aggregationMap.compute(analyticsKey, (key, existing) -> {
                    DemandAggregationData data = existing != null ? existing : new DemandAggregationData(0.0, order.getOrderGivenDate());
                    data.totalSales += netSoldWeight;
                    if (order.getOrderGivenDate().before(data.firstSaleDate)) {
                        data.firstSaleDate = order.getOrderGivenDate();
                    }
                    return data;
                });
            }
        }

        // N+1 önleme: tüm metrics'i tek sorguda map olarak yükle
        Map<String, InventoryMetrics> metricsMap = inventoryMetricsRepository.findAll().stream()
            .filter(m -> m.getAnalyticsKey() != null)
            .collect(java.util.stream.Collectors.toMap(InventoryMetrics::getAnalyticsKey, m -> m, (a, b) -> b));

        List<InventoryMetrics> metricsToSave = new java.util.ArrayList<>();
        for (Map.Entry<String, DemandAggregationData> entry : aggregationMap.entrySet()) {
            String analyticsKey = entry.getKey();
            DemandAggregationData data = entry.getValue();

            long days = java.util.concurrent.TimeUnit.MILLISECONDS.toDays(
                    today.getTime() - data.firstSaleDate.getTime());
            if (days < 1) {
                days = 1;
            }

            double dailyDemand = data.totalSales / days;
            double annualDemand = dailyDemand * 365;

            InventoryMetrics metrics = metricsMap.get(analyticsKey);
            if (metrics != null) {
                metrics.setAvgDailyDemand(dailyDemand);
                metrics.setAnnualDemand(annualDemand);
                metrics.setLastCalculatedAt(today);
                metricsToSave.add(metrics);
            }
        }
        inventoryMetricsRepository.saveAll(metricsToSave);

        return ResponseEntity.ok(null);
    }

    private Double toDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private String resolveAnalyticsKey(Product product) {
        if (product.getAnalyticsKey() != null && !product.getAnalyticsKey().isEmpty()) {
            return product.getAnalyticsKey();
        }
        String innerDiameter = null;
        if (product.getFields() != null && product.getFields().containsKey("iç çap")) {
            innerDiameter = Objects.toString(product.getFields().get("iç çap"), null);
        }
        return product.getProductCategoryId() + "-" + product.getDiameter() + "-" + innerDiameter;
    }

    private static class DemandAggregationData {
        double totalSales;
        Date firstSaleDate;

        DemandAggregationData(double totalSales, Date firstSaleDate) {
            this.totalSales = totalSales;
            this.firstSaleDate = firstSaleDate;
        }
    }

    private void calculateEOQ(InventoryMetrics inventoryMetrics, InventoryConfig inventoryConfig) {
        double annualDemand = inventoryMetrics.getAnnualDemand() != null ? inventoryMetrics.getAnnualDemand() : 0.0;
        double avgKgPrice = inventoryMetrics.getAvgKgPrice() != null ? inventoryMetrics.getAvgKgPrice() : 0.0;
        double denominator = inventoryConfig.getHoldingRate() * avgKgPrice;
        if (denominator <= 0 || annualDemand <= 0) {
            inventoryMetrics.setEoq(0.0);
            return;
        }
        double eoq = Math.sqrt((2 * annualDemand * inventoryConfig.getDefaultOrderingCost()) / denominator);
        inventoryMetrics.setEoq(eoq);
    }

    private void calculateEOQAllInventoryMetrics() {
        InventoryConfig inventoryConfig = inventoryConfigRepository.findAll().get(0);
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : inventoryMetrics) {
            calculateEOQ(inventoryMetric, inventoryConfig);
        }
        inventoryMetricsRepository.saveAll(inventoryMetrics);
    }
    private void calculateReorderPoint(InventoryMetrics inventoryMetrics, InventoryConfig inventoryConfig) {
        double avgDaily = inventoryMetrics.getAvgDailyDemand() != null ? inventoryMetrics.getAvgDailyDemand() : 0.0;
        inventoryMetrics.setReorderPoint(avgDaily * inventoryConfig.getReorderDays());
    }
    private void calculateReorderPointAllInventoryMetrics() {
        InventoryConfig inventoryConfig = inventoryConfigRepository.findAll().get(0);
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : inventoryMetrics) {
            calculateReorderPoint(inventoryMetric, inventoryConfig);
        }
        inventoryMetricsRepository.saveAll(inventoryMetrics);
    }

    private void calculateAnnualValue(InventoryMetrics inventoryMetrics) {
        double avgKg = inventoryMetrics.getAvgKgPrice() != null ? inventoryMetrics.getAvgKgPrice() : 0.0;
        double annual = inventoryMetrics.getAnnualDemand() != null ? inventoryMetrics.getAnnualDemand() : 0.0;
        inventoryMetrics.setAnnualValue(avgKg * annual);
    }

    private void calculateStockKg(InventoryMetrics inventoryMetrics){
        List<Product> products = productRepository.findAllByAnalyticsKey(inventoryMetrics.getAnalyticsKey());
        double stockKg = products.stream()
                .mapToDouble(p -> p.getWeight() != null ? p.getWeight() : 0.0)
                .sum();
        inventoryMetrics.setStockKg(stockKg);
    }

    private void calculateABCClassification() {

        List<InventoryMetrics> metrics =
            inventoryMetricsRepository.findAll();
    
    
        // sort descending
        metrics.sort(
            java.util.Comparator.<InventoryMetrics>comparingDouble(
                m -> m.getAnnualValue() != null ? m.getAnnualValue() : 0.0
            ).reversed()
        );
    
        double totalValue = metrics.stream()
            .mapToDouble(m -> m.getAnnualValue() != null ? m.getAnnualValue() : 0.0)
            .sum();

        if (totalValue <= 0) {
            for (InventoryMetrics m : metrics) {
                m.setAbcClass("C");
            }
            inventoryMetricsRepository.saveAll(metrics);
            log.info("calculateABCClassification: toplam annualValue=0, tüm kalemler C sınıfına atandı ({} kayıt)", metrics.size());
            return;
        }
    
        double cumulative = 0;
    
        for (InventoryMetrics m : metrics) {
            double annualVal = m.getAnnualValue() != null ? m.getAnnualValue() : 0.0;
            cumulative += annualVal;
            double ratio = cumulative / totalValue;
    
            if (ratio <= 0.7)
                m.setAbcClass("A");
            else if (ratio <= 0.9)
                m.setAbcClass("B");
            else
                m.setAbcClass("C");
        }
        inventoryMetricsRepository.saveAll(metrics);
    }

    private void clearUnnecessaryInventoryMetrics() {
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        List<Product> products = productRepository.findAll();
        // Aynı analyticsKey birden fazla üründe olabildiği için Set kullanıyoruz (sadece "bu key var mı?" kontrolü).
        Set<String> existingAnalyticsKeys = products.stream()
                .map(Product::getAnalyticsKey)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<InventoryMetrics> toDelete = inventoryMetrics.stream()
            .filter(m -> !existingAnalyticsKeys.contains(m.getAnalyticsKey()))
            .collect(Collectors.toList());
        inventoryMetricsRepository.deleteAll(toDelete);
    }

    public ResponseEntity<Void> calculateAllInventoryMetrics() {
        String phase = "start";
        try {
            log.info("calculateAllInventoryMetrics: başladı");
            phase = "initializeInventoryMetrics";
            initializeInventoryMetrics();
            phase = "clearUnnecessaryInventoryMetrics";
            clearUnnecessaryInventoryMetrics();
            phase = "calculateDemandAggregation";
            calculateDemandAggregation();
            phase = "setAvgKgPriceToInventoryMetrics";
            setAvgKgPriceToInventoryMetrics();
            phase = "loadInventoryConfig";
            InventoryConfig inventoryConfig = inventoryConfigRepository.findAll().get(0);
            phase = "loadAllInventoryMetrics";
            List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();

            // N+1 önleme: tüm product ağırlıklarını tek sorguda analyticsKey bazında topla
            phase = "aggregateStockKgByKey";
            Map<String, Double> stockKgByKey = productRepository.findAll().stream()
                .filter(p -> p.getAnalyticsKey() != null)
                .collect(Collectors.groupingBy(Product::getAnalyticsKey,
                    Collectors.summingDouble(p -> p.getWeight() != null ? p.getWeight() : 0.0)));

            Date now = new Date();
            phase = "perMetricEoqRopAnnualStock";
            for(InventoryMetrics inventoryMetric : inventoryMetrics) {
                calculateEOQ(inventoryMetric, inventoryConfig);
                calculateReorderPoint(inventoryMetric, inventoryConfig);
                calculateAnnualValue(inventoryMetric);
                inventoryMetric.setStockKg(stockKgByKey.getOrDefault(inventoryMetric.getAnalyticsKey(), 0.0));
                inventoryMetric.setLastCalculatedAt(now);
            }
            phase = "saveAllInventoryMetrics";
            inventoryMetricsRepository.saveAll(inventoryMetrics);
            phase = "calculateABCClassification";
            calculateABCClassification();
            log.info("calculateAllInventoryMetrics: tamamlandı");
            return ResponseEntity.ok(null);
        } catch (Exception e) {
            log.error(
                    "calculateAllInventoryMetrics: HATA phase=[{}] message=[{}]",
                    phase,
                    e.getMessage(),
                    e);
            throw e;
        }
    }

}
