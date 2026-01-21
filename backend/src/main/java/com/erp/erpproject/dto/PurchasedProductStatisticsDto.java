package com.erp.erpproject.dto;

import java.util.Date;
import java.util.Map;

import lombok.Data;

@Data
public class PurchasedProductStatisticsDto {
    private Double diameter;
    private Double purchaseLength;
    private Double purchaseWeight;
    private Double purchasePrice;
    private Double purchaseKgPrice;
    private Double purchaseTotalPrice;
    private Map<String, Object> fields;
    private Integer totalQuantity;
    private Date createdAt;
}
