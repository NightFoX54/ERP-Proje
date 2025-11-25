package com.erp.erpproject.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.erp.erpproject.security.UserPrincipal;

/**
 * Utility class for accessing current authenticated user information
 * Use this in your services to get the current user's info
 */
public class SecurityUtil {

    /**
     * Get current authenticated user principal
     * Returns null if no user is authenticated
     */
    public static UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) authentication.getPrincipal();
        }
        
        return null;
    }

    /**
     * Get current user's account ID
     */
    public static String getCurrentAccountId() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getAccountId() : null;
    }

    /**
     * Get current user's username
     */
    public static String getCurrentUsername() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getUsername() : null;
    }

    /**
     * Get current user's account type (ADMIN or BRANCH)
     */
    public static String getCurrentAccountType() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getAccountType() : null;
    }

    /**
     * Get current user's branch ID
     */
    public static String getCurrentBranchId() {
        UserPrincipal user = getCurrentUser();
        return user != null ? user.getBranchId() : null;
    }

    /**
     * Check if current user is ADMIN
     */
    public static boolean isAdmin() {
        UserPrincipal user = getCurrentUser();
        return user != null && user.isAdmin();
    }

    /**
     * Check if current user is BRANCH user
     */
    public static boolean isBranchUser() {
        UserPrincipal user = getCurrentUser();
        return user != null && user.isBranchUser();
    }

    /**
     * Check if current user has access to the given branch
     * Admin has access to all branches
     */
    public static boolean hasBranchAccess(String branchId) {
        UserPrincipal user = getCurrentUser();
        return user != null && user.hasBranchAccess(branchId);
    }

    /**
     * Require admin role, throw exception if not admin
     */
    public static void requireAdmin() {
        if (!isAdmin()) {
            throw new RuntimeException("Access denied: Admin role required");
        }
    }

    /**
     * Require branch access, throw exception if user doesn't have access
     */
    public static void requireBranchAccess(String branchId) {
        if (!hasBranchAccess(branchId)) {
            throw new RuntimeException("Access denied: You don't have access to this branch");
        }
    }
}

