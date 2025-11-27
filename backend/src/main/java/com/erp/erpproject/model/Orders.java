package com.erp.erpproject.model;

import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "orders")
public class Orders {
    @Id
    private String id;
    private String customerName;
    private String orderGivenBranchId;
    private String orderDeliveryBranchId;
    private String orderGivenDate;
    private String orderDeliveryDate;
    private OrderStatus orderStatus;
    private List<Map<String, Object>> orderItems;
    private Double totalPrice;
    private Double totalWastageWeight;
    private Double totalWastageLength;


    public enum OrderStatus {
        Oluşturuldu,
        Onaylandı,
        Hazır,
        Çıktı,
        İptal_Edildi
    }
}
