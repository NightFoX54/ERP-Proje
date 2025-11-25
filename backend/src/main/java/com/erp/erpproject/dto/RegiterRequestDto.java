package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegiterRequestDto {
    private String username;
    private String password;
    private String branchId;
}
