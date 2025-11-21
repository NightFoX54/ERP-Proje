package com.erp.erpproject.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * JWT configuration properties
 * You can configure these in application.properties:
 * jwt.secret=your-secret-key-here
 * jwt.expiration=86400000 (24 hours in milliseconds)
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret = "your-secret-key-change-this-in-production-use-a-long-random-string";
    private long expiration = 86400000; // 24 hours in milliseconds
}

