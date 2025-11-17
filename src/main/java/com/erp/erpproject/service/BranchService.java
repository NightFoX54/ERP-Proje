package com.erp.erpproject.service;

import java.util.List;

import org.springframework.stereotype.Service;

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
    public Branches createBranch(String name) {
        if (branchesRepository.existsByName(name)) {
            throw new RuntimeException("Branch already exists");
        }
        Branches branch = new Branches();
        branch.setName(name);
        return branchesRepository.save(branch);
    }
    public void deleteBranch(String id) {
        if (!branchesRepository.existsById(id)) {
            throw new RuntimeException("Branch not found");
        }
        branchesRepository.deleteById(id);
    }
}
