package com.erp.erpproject.dto;

import java.util.Date;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import com.erp.erpproject.model.Product;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatisticsSoldProductsDto {
    private Product product;
    private Double wastageWeight;
    private Double wastageLength;
    private Double cutLength;
    private Integer cutQuantity;
    private Double totalSoldWeight;
    private Double totalPrice;
    private Double kgPrice;
    private Date createdAt;
}
