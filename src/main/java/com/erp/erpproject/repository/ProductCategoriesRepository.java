package com.erp.erpproject.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.erp.erpproject.model.ProductCategories;

public interface ProductCategoriesRepository extends MongoRepository<ProductCategories, String> {
    Optional<ProductCategories> findById(String id);
    boolean existsById(String id);
    List<ProductCategories> findAll();
    Optional<ProductCategories> findByName(String name);
    boolean existsByName(String name);
    List<ProductCategories> findAllByBranchId(String branchId);
}
