package com.internship.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned once, right after an administrator creates a supervisor account,
 * so the temporary password can be relayed to the supervisor. It is never
 * retrievable again afterwards (only the bcrypt hash is stored).
 */
@Data
@AllArgsConstructor
public class SupervisorAccountDto {
    private UserDto supervisor;
    private String temporaryPassword;
}
