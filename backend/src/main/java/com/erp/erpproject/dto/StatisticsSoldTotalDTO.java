package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatisticsSoldTotalDTO {
    private Double totalSoldWeight;
    private Double totalPrice;
    private Double totalWastageWeight;
}
