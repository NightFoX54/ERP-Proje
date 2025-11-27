package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.dto.LoginRegisterResponseDto;
import com.erp.erpproject.dto.LoginRequestDto;
import com.erp.erpproject.dto.RegiterRequestDto;
import com.erp.erpproject.model.Accounts;
import com.erp.erpproject.service.AuthService;
import com.erp.erpproject.util.SecurityUtil;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/login")
    public ResponseEntity<LoginRegisterResponseDto> login(@RequestBody LoginRequestDto loginRequest) {
        try {
            String token = authService.login(loginRequest.getUsername(), loginRequest.getPassword());
            Accounts account = authService.getAccountByUsername(loginRequest.getUsername());
            return ResponseEntity.ok(new LoginRegisterResponseDto(token, account.getBranchId(), account.getAccountType().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new LoginRegisterResponseDto(null, null, null));
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<LoginRegisterResponseDto> register(@RequestBody RegiterRequestDto registerRequest) {
        try {
            String token = authService.register(registerRequest.getUsername(), registerRequest.getPassword(), registerRequest.getBranchId());
            Accounts account = authService.getAccountByUsername(registerRequest.getUsername());
            return ResponseEntity.ok(new LoginRegisterResponseDto(token, account.getBranchId(), account.getAccountType().name()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new LoginRegisterResponseDto(null, null, null));
        }
    }
    @GetMapping("/branches")
    public ResponseEntity<List<Accounts>> getBranches() {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        return ResponseEntity.ok(authService.getBranches());
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable String id) {
        if (!SecurityUtil.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        authService.deleteAccount(id);
        return ResponseEntity.ok().build();
    }

}
