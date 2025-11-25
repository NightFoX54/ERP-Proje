package com.erp.erpproject.service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.erp.erpproject.config.JwtProperties;
import com.erp.erpproject.model.Accounts;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    /**
     * Generate JWT token for an account
     */
    public String generateToken(Accounts account) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("accountId", account.getId());
        claims.put("username", account.getUsername());
        claims.put("accountType", account.getAccountType().name());
        claims.put("branchId", account.getBranchId());
        return createToken(claims, account.getUsername());
    }

    /**
     * Create JWT token with claims
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSignKey())
                .compact();
    }

    /**
     * Get signing key from secret
     * Handles both base64 encoded and raw string secrets
     */
    private SecretKey getSignKey() {
        String secret = jwtProperties.getSecret();
        byte[] keyBytes;
        
        try {
            // Try to decode as base64 first
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            // If not base64, use the raw string
            keyBytes = secret.getBytes();
        }
        
        // Ensure key is at least 32 bytes (256 bits) for HS256
        if (keyBytes.length < 32) {
            // Pad or repeat to reach minimum length
            byte[] paddedKey = new byte[32];
            System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, 32));
            for (int i = keyBytes.length; i < 32; i++) {
                paddedKey[i] = keyBytes[i % keyBytes.length];
            }
            keyBytes = paddedKey;
        }
        
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract account type from token
     */
    public String extractAccountType(String token) {
        return extractClaim(token, claims -> claims.get("accountType", String.class));
    }

    /**
     * Extract branch ID from token
     */
    public String extractBranchId(String token) {
        return extractClaim(token, claims -> claims.get("branchId", String.class));
    }

    /**
     * Extract account ID from token
     */
    public String extractAccountId(String token) {
        return extractClaim(token, claims -> claims.get("accountId", String.class));
    }

    /**
     * Extract a specific claim from token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from token
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if token is expired
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Validate token
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Validate token without UserDetails
     */
    public Boolean validateToken(String token) {
        try {
            extractAllClaims(token); // This will throw if token is invalid
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}

