package com.erp.erpproject.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.erp.erpproject.model.InventoryConfig;

@Repository
public interface InventoryConfigRepository extends MongoRepository<InventoryConfig, String> {
    List<InventoryConfig> findAll();    
}
