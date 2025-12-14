package com.erp.erpproject.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.erp.erpproject.model.Product;

public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findByProductCategoryId(String productCategoryId);
    boolean existsByProductCategoryId(String productCategoryId);
    List<Product> findAll();
    Optional<Product> findById(String id);
    List<Product> findAllByProductCategoryId(String productCategoryId);
    void deleteAllByProductCategoryId(String productCategoryId);
    List<Product> findAllByProductCategoryIdAndDiameter(String productCategoryId, Double diameter);
    List<Product> findAllByCreatedAtBetween(Date startDate, Date endDate);
}
