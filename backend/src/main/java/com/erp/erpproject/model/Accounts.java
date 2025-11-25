package com.erp.erpproject.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "accounts")
public class Accounts {
    @Id
    private String id;
    private String username;
    private String password;
    private AccountType accountType;
    private String branchId;


    public enum AccountType {
        ADMIN,
        BRANCH
    }
}
