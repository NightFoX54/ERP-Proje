package com.erp.erpproject.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.erp.erpproject.model.Branches;

public interface BranchesRepository extends MongoRepository<Branches, String> {
    Optional<Branches> findByName(String name);
    boolean existsByName(String name);
    List<Branches> findAll();
    List<Branches> findAllByIsStockEnabledTrue();
}
