package com.erp.erpproject.service;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.MainPageStatisticsDto;
import com.erp.erpproject.dto.PurchasedProductStatisticsDto;
import com.erp.erpproject.dto.StatisticsPurchaseTotalDTO;
import com.erp.erpproject.dto.StatisticsSoldProductsDto;
import com.erp.erpproject.dto.StatisticsSoldTotalDTO;
import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductCategories;
import com.erp.erpproject.repository.BranchesRepository;
import com.erp.erpproject.repository.OrdersRepository;
import com.erp.erpproject.repository.ProductCategoriesRepository;
import com.erp.erpproject.repository.ProductRepository;
import com.erp.erpproject.repository.ProductTypeRepository;
import com.erp.erpproject.security.UserPrincipal;

@Service
public class StatisticsService {
    private final ProductRepository productRepository;
    private final ProductCategoriesRepository productCategoriesRepository;
    private final ProductTypeRepository productTypeRepository;
    private final BranchesRepository branchesRepository;
    private final OrdersRepository ordersRepository;
    public StatisticsService(ProductRepository productRepository, ProductCategoriesRepository productCategoriesRepository, ProductTypeRepository productTypeRepository, BranchesRepository branchesRepository, OrdersRepository ordersRepository) {
        this.productRepository = productRepository;
        this.productCategoriesRepository = productCategoriesRepository;
        this.productTypeRepository = productTypeRepository;
        this.branchesRepository = branchesRepository;
        this.ordersRepository = ordersRepository;
    }

    public Map<String,Map<String, List<PurchasedProductStatisticsDto>>> getPurchasedProductsBetweenDates(Date startDate, Date endDate, UserPrincipal userPrincipal) {
        List<Product> products = productRepository.findAllByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate);

        if (userPrincipal != null && userPrincipal.isBranchUser()) {
            String branchId = userPrincipal.getBranchId();
            List<ProductCategories> branchCategories = productCategoriesRepository.findAllByBranchId(branchId);
            List<String> allowedCategoryIds = branchCategories.stream()
                    .map(ProductCategories::getId)
                    .collect(Collectors.toList());

            products = products.stream()
                    .filter(product -> product.getProductCategoryId() != null &&
                                     allowedCategoryIds.contains(product.getProductCategoryId()))
                    .collect(Collectors.toList());
        }

        Set<String> categoryIds = products.stream()
                .map(Product::getProductCategoryId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<String, ProductCategories> categoryMap = categoryIds.isEmpty()
                ? new HashMap<>()
                : productCategoriesRepository.findAllById(categoryIds).stream()
                        .collect(Collectors.toMap(ProductCategories::getId, pc -> pc));

        Map<String,Map<String, List<PurchasedProductStatisticsDto>>> result = new HashMap<>();
        for (Product product : products) {
            ProductCategories productCategory = categoryMap.get(product.getProductCategoryId());
            if (productCategory == null) {
                continue;
            }
            if (!result.containsKey(productCategory.getBranchId())) {
                result.put(productCategory.getBranchId(), new HashMap<>());
            }
            if (result.get(productCategory.getBranchId()).containsKey(product.getProductCategoryId())) {
                List<PurchasedProductStatisticsDto> purchasedProductStatisticsDtos = result.get(productCategory.getBranchId()).get(product.getProductCategoryId());

                PurchasedProductStatisticsDto purchasedProductStatisticsDto = new PurchasedProductStatisticsDto();
                purchasedProductStatisticsDto.setDiameter(product.getDiameter());
                purchasedProductStatisticsDto.setFields(product.getFields());
                purchasedProductStatisticsDto.setPurchaseLength(product.getPurchaseLength());
                purchasedProductStatisticsDto.setPurchaseWeight(product.getPurchaseWeight());
                purchasedProductStatisticsDto.setPurchasePrice(product.getPurchasePrice());
                purchasedProductStatisticsDto.setPurchaseKgPrice(product.getKgPrice());
                purchasedProductStatisticsDto.setCreatedAt(product.getCreatedAt());
                purchasedProductStatisticsDto.setTotalQuantity(product.getPurchaseStock());
                purchasedProductStatisticsDto.setPurchaseTotalPrice(product.getPurchasePrice());
                purchasedProductStatisticsDtos.add(purchasedProductStatisticsDto);

            }
            else {
                List<PurchasedProductStatisticsDto> purchasedProductStatisticsDtos = new ArrayList<>();
                PurchasedProductStatisticsDto purchasedProductStatisticsDto = new PurchasedProductStatisticsDto();
                purchasedProductStatisticsDto.setDiameter(product.getDiameter());
                purchasedProductStatisticsDto.setFields(product.getFields());
                purchasedProductStatisticsDto.setPurchaseLength(product.getPurchaseLength());   
                purchasedProductStatisticsDto.setPurchaseWeight(product.getPurchaseWeight());
                purchasedProductStatisticsDto.setPurchasePrice(product.getPurchasePrice());
                purchasedProductStatisticsDto.setPurchaseKgPrice(product.getKgPrice());
                purchasedProductStatisticsDto.setCreatedAt(product.getCreatedAt());
                purchasedProductStatisticsDto.setPurchaseTotalPrice(product.getPurchasePrice());
                purchasedProductStatisticsDto.setTotalQuantity(product.getPurchaseStock());
                purchasedProductStatisticsDtos.add(purchasedProductStatisticsDto);
                result.get(productCategory.getBranchId()).put(product.getProductCategoryId(), purchasedProductStatisticsDtos);
            }
        }
        return result;

    }

    private Integer getInnerDiameterFromFields(Product product) {
        if (product.getFields() != null && product.getFields().containsKey("iç çap")) {
            Object innerDiameterValue = product.getFields().get("iç çap");
            if (innerDiameterValue != null) {
                if (innerDiameterValue instanceof Double) {
                    return ((Double) innerDiameterValue).intValue();
                } else if (innerDiameterValue instanceof Integer) {
                    return (Integer) innerDiameterValue;
                } else if (innerDiameterValue instanceof String) {
                    try {
                        return Integer.parseInt((String) innerDiameterValue);
                    } catch (NumberFormatException e) {
                        return 0;
                    }
                }
            }
        }
        return 0;
    }

    private boolean isSameDay(Date date1, Date date2) {
        if (date1 == null || date2 == null) {
            return date1 == date2;
        }
        Calendar cal1 = Calendar.getInstance();
        cal1.setTime(date1);
        Calendar cal2 = Calendar.getInstance();
        cal2.setTime(date2);
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }

    public ResponseEntity<StatisticsPurchaseTotalDTO> getPurchasedProductsBetweenDatesTotal(Date startDate, Date endDate, UserPrincipal userPrincipal) {
        List<Product> products = productRepository.findAllByCreatedAtBetween(startDate, endDate);
        if (userPrincipal != null && userPrincipal.isBranchUser()) {
            String branchId = userPrincipal.getBranchId();
            List<ProductCategories> branchCategories = productCategoriesRepository.findAllByBranchId(branchId);
            List<String> allowedCategoryIds = branchCategories.stream()
                    .map(ProductCategories::getId)
                    .collect(Collectors.toList());
            
            products = products.stream()
                    .filter(product -> product.getProductCategoryId() != null && 
                                     allowedCategoryIds.contains(product.getProductCategoryId()))
                    .collect(Collectors.toList());
        }
        Double totalPurchasePrice = products.stream().mapToDouble(Product::getPurchasePrice).sum();
        Double totalPurchaseWeight = products.stream().mapToDouble(Product::getPurchaseWeight).sum();
        Double totalPurchaseQuantity = products.stream().mapToDouble(Product::getPurchaseStock).sum();
        return ResponseEntity.ok(new StatisticsPurchaseTotalDTO(totalPurchasePrice, totalPurchaseWeight, totalPurchaseQuantity));
    }

    public Map<String,Map<String,Map<String,List<StatisticsSoldProductsDto>>>> getSoldProductsBetweenDates(Date startDate, Date endDate, UserPrincipal userPrincipal) {
        List<Orders> orders = ordersRepository.findAllByOrderGivenDateBetweenOrderByOrderGivenDateDesc(startDate, endDate);
        if (userPrincipal != null && userPrincipal.isBranchUser()) {
            String branchId = userPrincipal.getBranchId();
            orders = orders.stream()
                    .filter(order -> order.getOrderDeliveryBranchId().equals(branchId))
                    .collect(Collectors.toList());
        }
        Set<String> productIds = new HashSet<>();
        for (Orders order : orders) {
            if (order.getSoldItems() != null) {
                for (Map<String, Object> soldItem : order.getSoldItems()) {
                    Object pid = soldItem.get("productId");
                    if (pid != null) {
                        productIds.add(pid.toString());
                    }
                }
            }
        }
        Map<String, Product> productMap = productIds.isEmpty()
                ? new HashMap<>()
                : productRepository.findAllById(productIds).stream()
                        .collect(Collectors.toMap(Product::getId, p -> p));

        Map<String,Map<String,Map<String,List<StatisticsSoldProductsDto>>>> result = new HashMap<>();
        for (Orders order : orders) {
            if (order.getSoldItems() == null) {
                continue;
            }
            if (!result.containsKey(order.getOrderDeliveryBranchId())) {
                result.put(order.getOrderDeliveryBranchId(), new HashMap<>());
            }
            if (!result.get(order.getOrderDeliveryBranchId()).containsKey(order.getCustomerName())) {
                result.get(order.getOrderDeliveryBranchId()).put(order.getCustomerName(), new HashMap<>());
            }

            for (Map<String, Object> soldItem : order.getSoldItems()) {
                Product product = productMap.get(soldItem.get("productId") != null ? soldItem.get("productId").toString() : null);
                if (product != null) {
                    if (!result.get(order.getOrderDeliveryBranchId()).get(order.getCustomerName()).containsKey(product.getProductCategoryId())) {
                        result.get(order.getOrderDeliveryBranchId()).get(order.getCustomerName()).put(product.getProductCategoryId(), new ArrayList<>());
                    }
                    List<StatisticsSoldProductsDto> statisticsSoldProductsDtos = result.get(order.getOrderDeliveryBranchId()).get(order.getCustomerName()).get(product.getProductCategoryId());
                    StatisticsSoldProductsDto statisticsSoldProductsDto = new StatisticsSoldProductsDto();
                    statisticsSoldProductsDto.setProduct(product);
                    statisticsSoldProductsDto.setWastageWeight((Double) soldItem.get("wastageWeight"));
                    statisticsSoldProductsDto.setWastageLength((Double) soldItem.get("wastageLength"));
                    if (soldItem.containsKey("cutLength")) {
                        statisticsSoldProductsDto.setCutLength((Double) soldItem.get("cutLength"));
                        statisticsSoldProductsDto.setCutQuantity((Integer) soldItem.get("cutQuantity"));
                    } else {
                        statisticsSoldProductsDto.setCutLength(0.0);
                        statisticsSoldProductsDto.setCutQuantity((Integer) soldItem.get("quantity"));
                    }
                    statisticsSoldProductsDto.setTotalSoldWeight((Double) soldItem.get("totalSoldWeight"));
                    statisticsSoldProductsDto.setTotalPrice((Double) soldItem.get("totalPrice"));
                    statisticsSoldProductsDto.setKgPrice((Double) soldItem.get("kgPrice"));
                    statisticsSoldProductsDto.setCreatedAt(order.getOrderGivenDate());
                    statisticsSoldProductsDtos.add(statisticsSoldProductsDto);
                }
            }
        }
        return result;
    }

    public ResponseEntity<StatisticsSoldTotalDTO> getSoldProductsBetweenDatesTotal(Date startDate, Date endDate, UserPrincipal userPrincipal) {
        List<Orders> orders = ordersRepository.findAllByOrderGivenDateBetweenOrderByOrderGivenDateDesc(startDate, endDate);
        if (userPrincipal != null && userPrincipal.isBranchUser()) {
            String branchId = userPrincipal.getBranchId();
            orders = orders.stream()
                    .filter(order -> order.getOrderDeliveryBranchId().equals(branchId))
                    .collect(Collectors.toList());
        }
        Double totalSoldWeight = orders.stream()
                .filter(order -> order.getTotalSaleWeight() != null)
                .mapToDouble(Orders::getTotalSaleWeight)
                .sum();
        Double totalPrice = orders.stream()
                .filter(order -> order.getTotalSaleWeight() != null)
                .mapToDouble(Orders::getTotalPrice)
                .sum();
        Double totalWastageWeight = orders.stream()
                .filter(order -> order.getTotalWastageWeight() != null)
                .mapToDouble(Orders::getTotalWastageWeight)
                .sum();
        return ResponseEntity.ok(new StatisticsSoldTotalDTO(totalSoldWeight, totalPrice, totalWastageWeight));
    }

    public ResponseEntity<MainPageStatisticsDto> getMainPageStatistics(UserPrincipal userPrincipal) {
        int totalProducts;
        int totalOrders;
        int totalWaitingOrders;
        if (userPrincipal != null && userPrincipal.isBranchUser()) {
            String branchId = userPrincipal.getBranchId();
            List<ProductCategories> productCategories = productCategoriesRepository.findAllByBranchId(branchId);
            List<String> branchCategoryIds = productCategories.stream()
                    .map(ProductCategories::getId)
                    .collect(Collectors.toList());
            totalProducts = branchCategoryIds.isEmpty() ? 0 : (int) productRepository.countByProductCategoryIdIn(branchCategoryIds);
            totalOrders = (int) ordersRepository.countByOrderDeliveryBranchId(branchId);
            totalWaitingOrders = (int) ordersRepository.countByOrderDeliveryBranchIdAndOrderStatusNot(branchId, Orders.OrderStatus.Çıktı);
        } else if (userPrincipal != null && userPrincipal.isAdmin()) {
            totalProducts = (int) productRepository.count();
            totalOrders = (int) ordersRepository.count();
            totalWaitingOrders = (int) ordersRepository.countByOrderStatusNot(Orders.OrderStatus.Çıktı);
        } else {
            totalProducts = 0;
            totalOrders = 0;
            totalWaitingOrders = 0;
        }
        return ResponseEntity.ok(new MainPageStatisticsDto(totalProducts, totalOrders, totalWaitingOrders));
    }
}
