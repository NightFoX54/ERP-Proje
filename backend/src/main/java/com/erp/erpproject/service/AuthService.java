package com.erp.erpproject.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.erp.erpproject.model.Accounts;
import com.erp.erpproject.repository.AccountsRepository;
import com.erp.erpproject.repository.BranchesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AccountsRepository accountsRepository;
    private final BranchesRepository branchesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String login(String username, String password) {
        Accounts account = accountsRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        
        if (!passwordEncoder.matches(password, account.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        // Generate JWT token
        return jwtService.generateToken(account);
    }

    public String register(String username, String password, String branchId) {
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
        
        Accounts savedAccount = accountsRepository.save(account);
        
        // Generate JWT token for the newly registered user
        return jwtService.generateToken(savedAccount);
    }

    public List<Accounts> getBranches() {
        return accountsRepository.findByAccountType(Accounts.AccountType.BRANCH);
    }

    public Accounts getAccountByUsername(String username) {
        return accountsRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public void deleteAccount(String id) {
        if (accountsRepository.findById(id).isEmpty()) {
            throw new RuntimeException("Account not found");
        }
        accountsRepository.deleteById(id);
    }
}
