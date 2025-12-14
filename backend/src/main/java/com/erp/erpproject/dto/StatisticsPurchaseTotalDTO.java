package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatisticsPurchaseTotalDTO {
    private Double totalPurchasePrice;
    private Double totalPurchaseWeight;
    private Double totalPurchaseQuantity;
}
