package com.erp.erpproject.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.erp.erpproject.service.InventoryMetricsService;

@Component
public class InventoryMetricsScheduler {

    private final InventoryMetricsService inventoryMetricsService;

    public InventoryMetricsScheduler(InventoryMetricsService inventoryMetricsService) {
        this.inventoryMetricsService = inventoryMetricsService;
    }

    /**
     * Her gün saat 02:00'de tüm envanter metriklerini hesapla (EOQ, ROP, ABC, talep)
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void calculateAllInventoryMetrics() {
        inventoryMetricsService.calculateAllInventoryMetrics();
    }
}
