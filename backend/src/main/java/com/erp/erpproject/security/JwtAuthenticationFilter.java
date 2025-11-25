package com.erp.erpproject.security;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.erp.erpproject.service.JwtService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * JWT Authentication Filter
 * Intercepts requests and validates JWT tokens
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Check if Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token
        jwt = authHeader.substring(7);

        try {
            // Validate token and extract username
            if (jwtService.validateToken(jwt)) {
                username = jwtService.extractUsername(jwt);
                String accountType = jwtService.extractAccountType(jwt);
                String branchId = jwtService.extractBranchId(jwt);
                String accountId = jwtService.extractAccountId(jwt);

                // Create authentication token with role
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Create authority based on account type
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + accountType);
                    
                    // Create custom user principal with account info
                    UserPrincipal userPrincipal = new UserPrincipal(
                        accountId,
                        username,
                        accountType,
                        branchId
                    );

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        java.util.Collections.singletonList(authority)
                    );
                    
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token is invalid, continue without authentication
            logger.error("JWT validation failed", e);
        }

        filterChain.doFilter(request, response);
    }
}

