package com.erp.erpproject.model;

import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
@Data
@Document(collection = "product_types")
public class ProductType {
    @Id
    private String id;
    private String name;
    private Map<String, Object> requiredFields;
}
