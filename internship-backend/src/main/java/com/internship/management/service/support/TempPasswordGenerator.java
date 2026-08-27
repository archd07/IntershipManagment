package com.internship.management.service.support;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Generates one-time temporary passwords for accounts created by an
 * administrator (supervisors, and students whose account is created
 * automatically when their guest application is accepted). The plain
 * password is only ever returned to the caller once, in the API response —
 * it is never stored or logged in plain text.
 */
@Component
public class TempPasswordGenerator {

    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(ALPHANUM.charAt(random.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }
}
