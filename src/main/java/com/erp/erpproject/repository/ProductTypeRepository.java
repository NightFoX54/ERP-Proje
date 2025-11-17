package com.erp.erpproject.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.erp.erpproject.model.ProductType;

public interface ProductTypeRepository extends MongoRepository<ProductType, String> {
    Optional<ProductType> findById(String id);
    boolean existsById(String id);
    List<ProductType> findAll();
    Optional<ProductType> findByName(String name);
    boolean existsByName(String name);
}
