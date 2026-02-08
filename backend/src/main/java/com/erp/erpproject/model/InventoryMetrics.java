package com.erp.erpproject.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
@Data
@Document(collection = "inventory_metrics")
public class InventoryMetrics {
    @Id
    private String id;

    private String productCategoryId;
    private Double diameter;
    private Double innerDiameter;

    private String analyticsKey;
    private Double eoq;
    private Double reorderPoint;
    private String abcClass;

    private Double annualDemand;
    private Double avgDailyDemand;
    private Double avgKgPrice;
    private Double annualValue;

    private Date lastCalculatedAt;
}
