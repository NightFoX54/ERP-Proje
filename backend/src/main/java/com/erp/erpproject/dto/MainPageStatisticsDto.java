package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MainPageStatisticsDto {
    private Integer totalProducts;
    private Integer totalOrders;
    private Integer totalWaitingOrders;
    
}
