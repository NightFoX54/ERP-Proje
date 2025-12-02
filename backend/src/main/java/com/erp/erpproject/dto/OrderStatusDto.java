package com.erp.erpproject.dto;

import com.erp.erpproject.model.Orders;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderStatusDto {
    private Orders.OrderStatus status;
    
}
