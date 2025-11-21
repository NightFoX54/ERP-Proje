package com.erp.erpproject.security;

import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * User principal containing account information from JWT
 * This is stored in SecurityContext and can be accessed in controllers/services
 */
@Data
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private final String accountId;
    private final String username;
    private final String accountType;
    private final String branchId;

    @Override
    public java.util.Collection<org.springframework.security.core.GrantedAuthority> getAuthorities() {
        return java.util.Collections.singletonList(
            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + accountType)
        );
    }

    @Override
    public String getPassword() {
        return null; // Password not stored in principal
    }

    @Override
    public String getUsername() {
        return username;
    }

    /**
     * Check if user is ADMIN
     */
    public boolean isAdmin() {
        return "ADMIN".equals(accountType);
    }

    /**
     * Check if user is BRANCH user
     */
    public boolean isBranchUser() {
        return "BRANCH".equals(accountType);
    }

    /**
     * Check if user's branch matches the given branch ID
     */
    public boolean hasBranchAccess(String branchId) {
        if (isAdmin()) {
            return true; // Admin has access to all branches
        }
        return this.branchId != null && this.branchId.equals(branchId);
    }
}
