package com.erp.erpproject.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.erp.erpproject.model.Accounts;

public interface AccountsRepository extends MongoRepository<Accounts, String> {
    Optional<Accounts> findByUsername(String username);
    boolean existsByUsername(String username);
    List<Accounts> findByAccountType(Accounts.AccountType accountType);
}
