package com.erp.erpproject.dto;

import lombok.Data;

@Data
public class AddStockRequestDto {
    private Integer addedStock;
    private Double addedWeight;
    /** Kullanıcı bu ikisinden sadece birini gönderir */
    private Double totalPurchasePrice;
    private Double kgPrice;
}
