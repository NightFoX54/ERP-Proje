package com.erp.erpproject.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.erp.erpproject.model.Accounts;
import com.erp.erpproject.repository.AccountsRepository;
import com.erp.erpproject.repository.BranchesRepository;
@Service
public class AuthService {
    private final AccountsRepository accountsRepository;
    private final BranchesRepository branchesRepository;
    private final PasswordEncoder passwordEncoder;
    public AuthService(AccountsRepository accountsRepository, BranchesRepository branchesRepository, PasswordEncoder passwordEncoder) {
        this.accountsRepository = accountsRepository;
        this.branchesRepository = branchesRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Accounts login(String username, String password) {
        Accounts account = accountsRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("Account not found"));
        if (passwordEncoder.matches(password, account.getPassword())) {
            return account;
        }
        throw new RuntimeException("Invalid password");
    }
    public Accounts register(String username, String password, String branchId) {
        if (accountsRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (branchesRepository.findById(branchId).isEmpty() && !branchId.equals("0")) {
            throw new RuntimeException("Branch not found");
        }
        Accounts account = new Accounts();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(password));
        account.setBranchId(branchId);
        account.setAccountType(Accounts.AccountType.BRANCH);
        return accountsRepository.save(account);
    }
    public List<Accounts> getBranches() {
        return accountsRepository.findByAccountType(Accounts.AccountType.BRANCH);
    }
    
}
