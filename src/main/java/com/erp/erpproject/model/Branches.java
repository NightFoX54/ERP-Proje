package com.erp.erpproject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "branches")
public class Branches {
    @Id
    private String id;
    private String name;

    
}
