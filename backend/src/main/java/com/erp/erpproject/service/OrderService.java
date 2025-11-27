package com.erp.erpproject.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;
import com.erp.erpproject.repository.OrdersRepository;

@Service
public class OrderService {
    @Autowired
    private OrdersRepository ordersRepository;

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
}
