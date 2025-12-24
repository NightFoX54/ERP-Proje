package com.erp.erpproject.model;

import java.util.Date;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
@Data
@Document(collection = "products")
public class Product {
    @Id
    private String id;
    private String productCategoryId;
    private Double weight;
    private Double length;
    private Double purchasePrice;
    private Integer stock;
    private Integer diameter;
    private Map<String, Object> fields;
    private Double kgPrice;
    private Boolean isActive;
    private Date createdAt;
    private Double purchaseLength;
    private Double purchaseWeight;
    private Integer purchaseStock;
}
