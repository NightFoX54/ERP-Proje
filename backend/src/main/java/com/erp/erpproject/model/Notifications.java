package com.erp.erpproject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Document(collection = "notifications")
@AllArgsConstructor
@NoArgsConstructor
public class Notifications {
    @Id
    private String id;
    private String orderId;
    private String message;
    private String accountId;
    private String deliveryBranchId;
    private String createdAt;
    private boolean isRead;
}
