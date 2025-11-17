package com.erp.erpproject.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.erp.erpproject.dto.LoginRegisterResponseDto;
import com.erp.erpproject.dto.LoginRequestDto;
import com.erp.erpproject.dto.RegiterRequestDto;
import com.erp.erpproject.model.Accounts;
import com.erp.erpproject.service.AuthService;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/login")
    public ResponseEntity<LoginRegisterResponseDto> login(@RequestBody LoginRequestDto loginRequest) {
        Accounts account = authService.login(loginRequest.getUsername(), loginRequest.getPassword());
        if (account == null) {
            return ResponseEntity.badRequest().body(new LoginRegisterResponseDto(null, null, null));
        }
        return ResponseEntity.ok(new LoginRegisterResponseDto("jwttokengenerated", account.getBranchId(), account.getAccountType().name()));
    }
    @PostMapping("/register")
    public ResponseEntity<LoginRegisterResponseDto> register(@RequestBody RegiterRequestDto registerRequest) {
        Accounts account = authService.register(registerRequest.getUsername(), registerRequest.getPassword(), registerRequest.getBranchId());
        if (account == null) {
            return ResponseEntity.badRequest().body(new LoginRegisterResponseDto(null, null, null));
        }
        return ResponseEntity.ok(new LoginRegisterResponseDto("jwttokengenerated", account.getBranchId(), account.getAccountType().name()));
    }
    @GetMapping("/branches")
    public ResponseEntity<List<Accounts>> getBranches() {
        return ResponseEntity.ok(authService.getBranches());
    }

}
