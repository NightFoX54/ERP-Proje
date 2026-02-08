package com.erp.erpproject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "inventory_config")
public class InventoryConfig {
    @Id
    private String id;
    private Double defaultOrderingCost;
    private Double holdingRate;
    private Integer reorderDays;
}
