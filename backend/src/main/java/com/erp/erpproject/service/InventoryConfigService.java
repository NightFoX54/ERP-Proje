package com.erp.erpproject.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.erp.erpproject.model.InventoryConfig;
import com.erp.erpproject.repository.InventoryConfigRepository;

@Service
public class InventoryConfigService {

    private final InventoryConfigRepository inventoryConfigRepository;

    public InventoryConfigService(InventoryConfigRepository inventoryConfigRepository) {
        this.inventoryConfigRepository = inventoryConfigRepository;
    }

    public List<InventoryConfig> getAll() {
        return inventoryConfigRepository.findAll();
    }

    public InventoryConfig getFirst() {
        List<InventoryConfig> configs = inventoryConfigRepository.findAll();
        if (configs.isEmpty()) {
            InventoryConfig config = new InventoryConfig();
            config.setDefaultOrderingCost(1000.0);
            config.setHoldingRate(0.20);
            config.setReorderDays(14);
            return inventoryConfigRepository.save(config);
        }
        return configs.get(0);
    }

    public InventoryConfig update(String id, InventoryConfig updates) {
        InventoryConfig config = inventoryConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("InventoryConfig not found: " + id));
        if (updates.getDefaultOrderingCost() != null) {
            config.setDefaultOrderingCost(updates.getDefaultOrderingCost());
        }
        if (updates.getHoldingRate() != null) {
            config.setHoldingRate(updates.getHoldingRate());
        }
        if (updates.getReorderDays() != null) {
            config.setReorderDays(updates.getReorderDays());
        }
        return inventoryConfigRepository.save(config);
    }
}
