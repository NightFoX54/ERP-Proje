package com.erp.erpproject.repository;

import java.util.Date;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.erp.erpproject.model.Orders;
import com.erp.erpproject.model.Orders.OrderStatus;

@Repository
public interface OrdersRepository extends MongoRepository<Orders, String> {
    List<Orders> findAllByOrderByOrderGivenDateDesc();
    List<Orders> findAllByOrderStatus(OrderStatus orderStatus);
    List<Orders> findAllByOrderStatusIn(List<OrderStatus> orderStatuses);
    List<Orders> findAllByOrderStatusInAndOrderGivenDateAfter(List<OrderStatus> orderStatuses, Date startDate);
    List<Orders> findAllByOrderGivenDateBetweenOrderByOrderGivenDateDesc(Date startDate, Date endDate);
    long countByOrderDeliveryBranchId(String orderDeliveryBranchId);
    long countByOrderDeliveryBranchIdAndOrderStatusNot(String orderDeliveryBranchId, OrderStatus orderStatus);
    long countByOrderStatusNot(OrderStatus orderStatus);
}