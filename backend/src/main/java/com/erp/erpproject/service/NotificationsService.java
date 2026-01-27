package com.erp.erpproject.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.erp.erpproject.model.Notifications;
import com.erp.erpproject.repository.NotificationsRepository;
import com.erp.erpproject.repository.AccountsRepository;
import com.erp.erpproject.model.Accounts;

@Service    
public class NotificationsService {

    @Autowired
    private NotificationsRepository notificationsRepository;
    @Autowired
    private AccountsRepository accountsRepository;

    public List<Notifications> getNotificationsByAccountId(String accountId) {
        return notificationsRepository.findByAccountId(accountId);
    }

    public List<Notifications> getNotificationsByDeliveryBranchId(String deliveryBranchId) {
        return notificationsRepository.findByDeliveryBranchId(deliveryBranchId);
    }

    public void sendNotification(String orderId, String message, String accountId, String deliveryBranchId) {
        Notifications notification = new Notifications();
        notification.setOrderId(orderId);
        notification.setMessage(message);
        notification.setAccountId(accountId);
        notification.setDeliveryBranchId(deliveryBranchId);
        notification.setCreatedAt(LocalDateTime.now().toString());
        notification.setRead(false);
        notificationsRepository.save(notification);
    }

    public void sendOrderCreationNotification(String orderId, String deliveryBranchId, String customerName){
        String message = customerName + " isimli müşteriye yeni bir sipariş oluşturuldu.";

        List<Accounts> accounts = accountsRepository.findByBranchId(deliveryBranchId);
        List<Accounts> admins = accountsRepository.findByBranchId("0"); // 0 is the admin branch id
        for (Accounts account : accounts) {
            sendNotification(orderId, message, account.getId(), deliveryBranchId);
        }
        for (Accounts admin : admins) {
            sendNotification(orderId, message, admin.getId(), "0");
        }
    }

    public List<Notifications> getUnreadNotificationsByAccountId(String accountId) {
        return notificationsRepository.findByAccountIdAndIsRead(accountId, false);
    }
}
