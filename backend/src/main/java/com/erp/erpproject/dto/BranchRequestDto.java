package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BranchRequestDto {
    private String name;
    private Boolean isStockEnabled;
}

