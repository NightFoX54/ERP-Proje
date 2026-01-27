package com.erp.erpproject.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.erp.erpproject.model.Notifications;

@Repository
public interface NotificationsRepository extends MongoRepository<Notifications, String> {

    List<Notifications> findByAccountId(String accountId);
    List<Notifications> findByDeliveryBranchId(String deliveryBranchId);
    List<Notifications> findByAccountIdAndIsRead(String accountId, boolean isRead);
    List<Notifications> findByCreatedAt(String createdAt);
    List<Notifications> findByMessage(String message);
    List<Notifications> findByAccountIdAndDeliveryBranchId(String accountId, String deliveryBranchId);
    List<Notifications> findByAccountIdAndDeliveryBranchIdAndIsRead(String accountId, String deliveryBranchId, boolean isRead);
    List<Notifications> findByAccountIdAndDeliveryBranchIdAndCreatedAt(String accountId, String deliveryBranchId, String createdAt);
    List<Notifications> findByAccountIdAndDeliveryBranchIdAndMessage(String accountId, String deliveryBranchId, String message);
}
