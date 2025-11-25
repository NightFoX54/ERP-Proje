package com.erp.erpproject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRegisterResponseDto {
    private String token;
    private String branchId;
    private String accountType;
}
