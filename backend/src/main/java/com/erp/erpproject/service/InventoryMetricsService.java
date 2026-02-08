package com.erp.erpproject.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.erp.erpproject.model.InventoryConfig;
import com.erp.erpproject.model.InventoryMetrics;
import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.repository.InventoryConfigRepository;
import com.erp.erpproject.repository.InventoryMetricsRepository;
import com.erp.erpproject.repository.OrdersRepository;
import com.erp.erpproject.repository.ProductRepository;

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
        for(Product product : products){
            if(product.getAnalyticsKey() == null){
                String innerDiameter = null;
                if(product.getFields().containsKey("iç çap")){
                    innerDiameter = product.getFields().get("iç çap").toString();
                }
                product.setAnalyticsKey(product.getProductCategoryId() + "-" + product.getDiameter().toString() + "-" + innerDiameter);
                productRepository.save(product);
            }
            if(inventoryMetricsRepository.findByAnalyticsKey(product.getAnalyticsKey()) != null){
                continue;
            }
            InventoryMetrics inventoryMetrics = new InventoryMetrics();
            inventoryMetrics.setAnalyticsKey(product.getAnalyticsKey());
            inventoryMetrics.setProductCategoryId(product.getProductCategoryId());
            inventoryMetrics.setDiameter(product.getDiameter());
            if(product.getFields().containsKey("iç çap")){
                inventoryMetrics.setInnerDiameter(Double.parseDouble(product.getFields().get("iç çap").toString()));
            }
            inventoryMetrics.setEoq(0.0);
            inventoryMetrics.setReorderPoint(0.0);
            inventoryMetrics.setAbcClass("A");
            inventoryMetrics.setAnnualDemand(0.0);
            inventoryMetrics.setAvgDailyDemand(0.0);
            inventoryMetrics.setLastCalculatedAt(new Date());
            inventoryMetricsRepository.save(inventoryMetrics);
        }
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
        for(InventoryMetrics inventoryMetric : inventoryMetricsRepository.findAll()) {
            inventoryMetric.setAvgKgPrice(avgKgPriceMapByAnalyticsKey.get(inventoryMetric.getAnalyticsKey()));
            inventoryMetricsRepository.save(inventoryMetric);
        }
        return ResponseEntity.ok(null);
    }
    /**
     * Demand aggregation pipeline: soldItems.productId → Product → analyticsKey
     * Sadece Hazır ve Çıktı durumundaki siparişler dahil edilir.
     * group by analyticsKey, sum(totalSoldWeight), dailyDemand = totalSales / days, annualDemand = dailyDemand * 365
     */
    public ResponseEntity<Void> calculateDemandAggregation() {
        List<OrderStatus> includedStatuses = List.of(OrderStatus.Hazır, OrderStatus.Çıktı);
        List<Orders> orders = ordersRepository.findAllByOrderStatusInAndOrderGivenDateAfter(includedStatuses, Date.from(Instant.now().minus(365, ChronoUnit.DAYS)));

        // analyticsKey -> { totalSales, firstSaleDate }
        Map<String, DemandAggregationData> aggregationMap = new java.util.HashMap<>();
        Map<String, Product> productMap =
            productRepository.findAll().stream()
            .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));

        

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

            InventoryMetrics metrics = inventoryMetricsRepository.findByAnalyticsKey(analyticsKey);
            if (metrics != null) {
                metrics.setAvgDailyDemand(dailyDemand);
                metrics.setAnnualDemand(annualDemand);
                metrics.setLastCalculatedAt(today);
                inventoryMetricsRepository.save(metrics);
            }
        }

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

    private void calculateEOQ(InventoryMetrics inventoryMetrics) {
        InventoryConfig inventoryConfig = inventoryConfigRepository.findAll().get(0);
        Double eoq = Math.sqrt((2 * inventoryMetrics.getAnnualDemand() * inventoryConfig.getDefaultOrderingCost()) / (inventoryConfig.getHoldingRate() * inventoryMetrics.getAvgDailyDemand()));
        inventoryMetrics.setEoq(eoq);
    }

    private void calculateEOQAllInventoryMetrics() {
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : inventoryMetrics) {
            calculateEOQ(inventoryMetric);
            inventoryMetricsRepository.save(inventoryMetric);
        }
    }
    private void calculateReorderPoint(InventoryMetrics inventoryMetrics) {
        InventoryConfig inventoryConfig = inventoryConfigRepository.findAll().get(0);
        Double reorderPoint = inventoryMetrics.getAvgDailyDemand() * inventoryConfig.getReorderDays();
        inventoryMetrics.setReorderPoint(reorderPoint);
    }
    private void calculateReorderPointAllInventoryMetrics() {
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : inventoryMetrics) {
            calculateReorderPoint(inventoryMetric);
            inventoryMetricsRepository.save(inventoryMetric);
        }
    }

    private void calculateAnnualValue(InventoryMetrics inventoryMetrics) {
        inventoryMetrics.setAnnualValue(inventoryMetrics.getAvgKgPrice() * inventoryMetrics.getAnnualDemand());
    }

    private void calculateABCClassification() {

        List<InventoryMetrics> metrics =
            inventoryMetricsRepository.findAll();
    
    
        // sort descending
        metrics.sort(
            java.util.Comparator.comparingDouble(
                InventoryMetrics::getAnnualValue
            ).reversed()
        );
    
        double totalValue = metrics.stream()
            .mapToDouble(InventoryMetrics::getAnnualValue)
            .sum();
    
        double cumulative = 0;
    
        for (InventoryMetrics m : metrics) {
            cumulative += m.getAnnualValue();
            double ratio = cumulative / totalValue;
    
            if (ratio <= 0.7)
                m.setAbcClass("A");
            else if (ratio <= 0.9)
                m.setAbcClass("B");
            else
                m.setAbcClass("C");
    
            inventoryMetricsRepository.save(m);
        }
    }

    public ResponseEntity<Void> calculateAllInventoryMetrics() {
        initializeInventoryMetrics();
        calculateDemandAggregation();
        setAvgKgPriceToInventoryMetrics();
        List<InventoryMetrics> inventoryMetrics = inventoryMetricsRepository.findAll();
        for(InventoryMetrics inventoryMetric : inventoryMetrics) {
            calculateEOQ(inventoryMetric);
            calculateReorderPoint(inventoryMetric);
            calculateAnnualValue(inventoryMetric);
            inventoryMetric.setLastCalculatedAt(new Date());
            inventoryMetricsRepository.save(inventoryMetric);
        }
        calculateABCClassification();
        return ResponseEntity.ok(null);
    }

}
