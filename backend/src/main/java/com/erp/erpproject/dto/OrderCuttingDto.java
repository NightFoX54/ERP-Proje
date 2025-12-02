package com.erp.erpproject.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderCuttingDto {
    private String orderId;
    private List<CuttingInfoDto> cuttingInfo;
}

