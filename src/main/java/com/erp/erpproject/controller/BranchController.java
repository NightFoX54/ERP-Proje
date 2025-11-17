package com.erp.erpproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.List;
import org.springframework.web.bind.annotation.RestController;


import com.erp.erpproject.model.Branches;
import com.erp.erpproject.service.BranchService;

@RestController
@RequestMapping("/api/branches")
public class BranchController {
    @Autowired
    private BranchService branchService;

    @GetMapping
    public List<Branches> getBranches() {
        return branchService.getBranches();
    }
    @PostMapping
    public Branches createBranch(@RequestBody String name) {
        return branchService.createBranch(name);
    }
    @DeleteMapping("/{id}")
    public void deleteBranch(@PathVariable String id) {
        branchService.deleteBranch(id);
    }
}
