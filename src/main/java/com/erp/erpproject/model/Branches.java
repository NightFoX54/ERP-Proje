package com.erp.erpproject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Document(collection = "branches")
@AllArgsConstructor
@NoArgsConstructor
public class Branches {
    @Id
    private String id;
    private String name;
    private boolean isStockEnabled;

}
