package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.dto.BranchRequestDto;
import com.erp.erpproject.model.Branches;
import com.erp.erpproject.service.BranchService;
import com.erp.erpproject.util.SecurityUtil;

@RestController
@RequestMapping("/api/branches")
public class BranchController {
    @Autowired
    private BranchService branchService;

    @GetMapping
    public ResponseEntity<List<Branches>> getBranches() {
        return ResponseEntity.ok(branchService.getBranches());
    }
    
    @PostMapping
    public ResponseEntity<Branches> createBranch(@RequestBody BranchRequestDto request) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(branchService.createBranch(request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable String id) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        branchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/stock-enabled")
    public ResponseEntity<Void> updateBranchStockEnabled(@PathVariable String id, @RequestBody Boolean isStockEnabled) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        branchService.updateBranchStockEnabled(id, isStockEnabled);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/stock-enabled")
    public ResponseEntity<List<Branches>> getBranchesByStockEnabled() {
        return ResponseEntity.ok(branchService.getBranchesByStockEnabled());
    }
}
