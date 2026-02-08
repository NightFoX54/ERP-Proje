package com.erp.erpproject.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.model.InventoryConfig;
import com.erp.erpproject.service.InventoryConfigService;
import com.erp.erpproject.util.SecurityUtil;

@RestController
@RequestMapping("/api/inventory-config")
public class InventoryConfigController {

    private final InventoryConfigService inventoryConfigService;

    public InventoryConfigController(InventoryConfigService inventoryConfigService) {
        this.inventoryConfigService = inventoryConfigService;
    }

    @GetMapping
    public ResponseEntity<InventoryConfig> getConfig() {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(inventoryConfigService.getFirst());
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryConfig> updateConfig(@PathVariable String id, @RequestBody InventoryConfig updates) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(inventoryConfigService.update(id, updates));
    }
}
