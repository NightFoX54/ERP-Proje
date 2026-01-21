package com.erp.erpproject.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.CuttingInfoDto;
import com.erp.erpproject.dto.OrderCuttingDto;
import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.model.ProductType;
import com.erp.erpproject.repository.OrdersRepository;
import com.erp.erpproject.repository.ProductCategoriesRepository;
import com.erp.erpproject.repository.ProductRepository;
import com.erp.erpproject.repository.ProductTypeRepository;

@Service
public class OrderService {
    @Autowired
    private OrdersRepository ordersRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductTypeRepository productTypeRepository;
    @Autowired
    private ProductCategoriesRepository productCategoriesRepository;

    public List<Orders> getOrders() {
        return ordersRepository.findAllByOrderByOrderGivenDateDesc();
    }

    public Orders createOrder(Orders order) {
        return ordersRepository.save(order);
    }

    public List<Orders> getOrdersByOrderStatus(OrderStatus orderStatus) {
        return ordersRepository.findAllByOrderStatus(orderStatus);
    }

    public Orders getOrderById(String id) {
        return ordersRepository.findById(id).orElse(null);
    }
    public Orders updateOrderStatus(String id, String status) {
        Orders order = ordersRepository.findById(id).orElse(null);
        if (order != null) {
            order.setOrderStatus(OrderStatus.valueOf(status));
            return ordersRepository.save(order);
        }
        throw new RuntimeException("Order not found");
    }
    public Orders updateOrderCutting(String id, OrderCuttingDto cutting) {
        Orders order = ordersRepository.findById(id).orElse(null);
        if (order != null) {
            // Null check için başlangıç değerleri
            if (order.getTotalWastageWeight() == null) {
                order.setTotalWastageWeight(0.0);
            }
            if (order.getTotalWastageLength() == null) {
                order.setTotalWastageLength(0.0);
            }
            if (order.getTotalSaleWeight() == null) {
                order.setTotalSaleWeight(0.0);
            }
            if (order.getTotalSaleLength() == null) {
                order.setTotalSaleLength(0.0);
            }
            if (order.getSoldItems() == null) {
                order.setSoldItems(new ArrayList<Map<String, Object>>());
            }
            if(order.getTotalPrice() == null) {
                order.setTotalPrice(0.0);
            }
            for (CuttingInfoDto cuttingInfo : cutting.getCuttingInfo()) {
                Product product = productRepository.findById(cuttingInfo.getProductId()).orElse(null);
                ProductType productType = productTypeRepository.findById(productCategoriesRepository.findById(product.getProductCategoryId()).orElse(null).getProductTypeId()).orElse(null);

                if (product != null) {
                    Integer wastageLength = 0;
                    if(productType.getName().equals("Dolu") && cuttingInfo.getCutLength() != null) {
                        if((cuttingInfo.getCutLength() + 3) * cuttingInfo.getQuantity() > product.getLength()) {
                            wastageLength = 3 * (cuttingInfo.getQuantity() - 1);
                        } else {
                            wastageLength = 3 * cuttingInfo.getQuantity();
                        }
                    }
                    
                    // Double cast ile integer division sorununu çöz
                    // Formül: π * r² * h * yoğunluk
                    // r = diameter/2 (mm), h = wastageLength (mm)
                    // mm'den m'ye çevir: /1000
                    // r (m) = diameter/2/1000 = diameter/2000
                    // h (m) = wastageLength/1000
                    // Ağırlık (kg) = π * (diameter/2000)² * (wastageLength/1000) * 7850
                    Double wastageWeight = 0.0;
                    if(productType.getName().equals("Dolu") && cuttingInfo.getCutLength() != null) {
                        Double wastageLengthM = wastageLength / 1000.0;
                        Double diameterM = product.getDiameter() / 2000.0;
                        wastageWeight = wastageLengthM * diameterM * diameterM * Math.PI * 7850.0;
                        
                        Integer cutLength = cuttingInfo.getCutLength() * cuttingInfo.getQuantity();
                        product.setLength(product.getLength() - wastageLength - cutLength);
                        product.setWeight(product.getWeight() - wastageWeight - cuttingInfo.getTotalCutWeight());
                        if(product.getLength() <= 0 || product.getWeight() <= 0) {
                            product.setIsActive(false);
                        }
                        order.setTotalSaleLength(order.getTotalSaleLength() + cutLength);
                        order.setTotalWastageWeight(order.getTotalWastageWeight() + wastageWeight);
                    order.setTotalWastageLength(order.getTotalWastageLength() + wastageLength.doubleValue());
                    }
                    else{
                        product.setStock(product.getStock() - cuttingInfo.getQuantity());
                        product.setWeight(product.getWeight() - cuttingInfo.getTotalCutWeight());
                        if(product.getWeight() <= 1) {
                            product.setIsActive(false);
                        }
                        if(product.getStock() <= 0) {
                            product.setIsActive(false);
                        }
                    }
                    productRepository.save(product);
                    
                    // Null-safe toplama
                    order.setTotalSaleWeight(order.getTotalSaleWeight() + cuttingInfo.getTotalCutWeight());

                    if(productType.getName().equals("Dolu"))
                        order.getSoldItems().add(Map.of("productId", product.getId(), "totalSoldWeight", cuttingInfo.getTotalCutWeight(), "kgPrice", cuttingInfo.getKgPrice(), "totalPrice", cuttingInfo.getTotalCutWeight() * cuttingInfo.getKgPrice(), "wastageWeight", wastageWeight, "wastageLength", (double)wastageLength, "cutLength", (double)cuttingInfo.getCutLength(), "cutQuantity", cuttingInfo.getQuantity()));
                    else
                        order.getSoldItems().add(Map.of("productId", product.getId(), "totalSoldWeight", cuttingInfo.getTotalCutWeight(), "kgPrice", cuttingInfo.getKgPrice(), "totalPrice", cuttingInfo.getTotalCutWeight() * cuttingInfo.getKgPrice(), "wastageWeight", wastageWeight, "wastageLength", (double)wastageLength, "quantity", cuttingInfo.getQuantity()));
                    order.setTotalPrice(order.getTotalPrice() + cuttingInfo.getTotalCutWeight() * cuttingInfo.getKgPrice());
                }
            }
            updateOrderStatus(id, "Hazır");
            return ordersRepository.save(order);
        }
        throw new RuntimeException("Order not found");
    }
}
