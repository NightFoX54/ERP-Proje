package com.erp.erpproject.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.erp.erpproject.dto.BranchRequestDto;
import com.erp.erpproject.model.Branches;
import com.erp.erpproject.repository.BranchesRepository;

@Service
public class BranchService {
    private final BranchesRepository branchesRepository;
    public BranchService(BranchesRepository branchesRepository) {
        this.branchesRepository = branchesRepository;
    }
    public List<Branches> getBranches() {
        return branchesRepository.findAll();
    }
    public Branches createBranch(BranchRequestDto request) {
        if (branchesRepository.existsByName(request.getName())) {
            throw new RuntimeException("Branch already exists");
        }
        Branches branch = new Branches();
        branch.setName(request.getName());
        branch.setStockEnabled(request.getIsStockEnabled());
        return branchesRepository.save(branch);
    }
    public void deleteBranch(String id) {
        if (!branchesRepository.existsById(id)) {
            throw new RuntimeException("Branch not found");
        }
        branchesRepository.deleteById(id);
    }
    public void updateBranchStockEnabled(String id, Boolean isStockEnabled) {
        if (!branchesRepository.existsById(id)) {
            throw new RuntimeException("Branch not found");
        }
        Branches branch = branchesRepository.findById(id).orElseThrow(() -> new RuntimeException("Branch not found"));
        branch.setStockEnabled(isStockEnabled);
        branchesRepository.save(branch);
    }
    public List<Branches> getBranchesByStockEnabled() {
        return branchesRepository.findAllByIsStockEnabledTrue();
    }
}
