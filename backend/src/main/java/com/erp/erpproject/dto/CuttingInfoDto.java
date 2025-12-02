package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CuttingInfoDto {
    private String productId;
    private Integer quantity;
    private Integer cutLength;
    private Double totalCutWeight;
}

