package com.erp.erpproject.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.erp.erpproject.model.InventoryMetrics;

@Repository
public interface InventoryMetricsRepository extends MongoRepository<InventoryMetrics, String> {
    InventoryMetrics findByAnalyticsKey(String analyticsKey);
}
