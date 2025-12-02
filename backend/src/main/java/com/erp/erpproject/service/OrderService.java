package com.erp.erpproject.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.OrderCuttingDto;
import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;
import com.erp.erpproject.repository.OrdersRepository;
import com.erp.erpproject.dto.CuttingInfoDto;
import com.erp.erpproject.model.Product;
import com.erp.erpproject.repository.ProductRepository;

@Service
public class OrderService {
    @Autowired
    private OrdersRepository ordersRepository;
    @Autowired
    private ProductRepository productRepository;

    public List<Orders> getOrders() {
        return ordersRepository.findAll();
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
            
            for (CuttingInfoDto cuttingInfo : cutting.getCuttingInfo()) {
                Product product = productRepository.findById(cuttingInfo.getProductId()).orElse(null);
                if (product != null && cuttingInfo.getCutLength() != null) {
                    Integer wastageLength = 0;
                    if((cuttingInfo.getCutLength() + 3) * cuttingInfo.getQuantity() > product.getLength()) {
                        wastageLength = 3 * (cuttingInfo.getQuantity() - 1);
                    } else {
                        wastageLength = 3 * cuttingInfo.getQuantity();
                    }
                    
                    // Double cast ile integer division sorununu çöz
                    // Formül: π * r² * h * yoğunluk
                    // r = diameter/2 (mm), h = wastageLength (mm)
                    // mm'den m'ye çevir: /1000
                    // r (m) = diameter/2/1000 = diameter/2000
                    // h (m) = wastageLength/1000
                    // Ağırlık (kg) = π * (diameter/2000)² * (wastageLength/1000) * 7850
                    Double wastageLengthM = wastageLength / 1000.0;
                    Double diameterM = product.getDiameter() / 2000.0;
                    Double wastageWeight = wastageLengthM * diameterM * diameterM * Math.PI * 7850.0;
                    
                    Integer cutLength = cuttingInfo.getCutLength() * cuttingInfo.getQuantity();
                    product.setLength(product.getLength() - wastageLength - cutLength);
                    product.setWeight(product.getWeight() - wastageWeight - cuttingInfo.getTotalCutWeight());
                    if(product.getLength() <= 0 || product.getWeight() <= 0) {
                        product.setIsActive(false);
                    }
                    productRepository.save(product);
                    
                    // Null-safe toplama
                    order.setTotalWastageWeight(order.getTotalWastageWeight() + wastageWeight);
                    order.setTotalWastageLength(order.getTotalWastageLength() + wastageLength.doubleValue());
                }
            }
            updateOrderStatus(id, "Hazır");
            return ordersRepository.save(order);
        }
        throw new RuntimeException("Order not found");
    }
}
