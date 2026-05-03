package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.model.InventoryMetrics;
import com.erp.erpproject.service.InventoryMetricsService;
import com.erp.erpproject.util.SecurityUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/inventory-metrics")
public class InventoryMetricsController {
    private final InventoryMetricsService inventoryMetricsService;

    public InventoryMetricsController(InventoryMetricsService inventoryMetricsService) {
        this.inventoryMetricsService = inventoryMetricsService;
    }

    private void logForbidden(String operation) {
        log.warn(
                "inventory-metrics FORBIDDEN operation={} username={} accountType={} principalMissing={}",
                operation,
                SecurityUtil.getCurrentUsername(),
                SecurityUtil.getCurrentAccountType(),
                SecurityUtil.getCurrentUser() == null);
    }

    @GetMapping
    public ResponseEntity<List<InventoryMetrics>> getAll() {
        if (!SecurityUtil.isAdmin()) {
            logForbidden("GET /api/inventory-metrics");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(inventoryMetricsService.getAll());
    }

    @PostMapping("/initialize")
    public ResponseEntity<Void> initializeInventoryMetrics() {
        if (!SecurityUtil.isAdmin()) {
            logForbidden("POST /api/inventory-metrics/initialize");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return inventoryMetricsService.initializeInventoryMetrics();
    }

    @PostMapping("/calculate-demand")
    public ResponseEntity<Void> calculateDemandAggregation() {
        if (!SecurityUtil.isAdmin()) {
            logForbidden("POST /api/inventory-metrics/calculate-demand");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return inventoryMetricsService.calculateDemandAggregation();
    }

    @PostMapping("/calculate-all")
    public ResponseEntity<Void> calculateAllInventoryMetrics() {
        if (!SecurityUtil.isAdmin()) {
            logForbidden("POST /api/inventory-metrics/calculate-all");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return inventoryMetricsService.calculateAllInventoryMetrics();
    }
}
