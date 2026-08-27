package com.internship.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned to the administrator when viewing a supervisor's detail. Unlike
 * SupervisorAccountDto (shown once, right at creation), pendingTemporaryPassword
 * here persists across page reloads / re-selections — it stays populated until
 * the supervisor actually logs in and changes their password, at which point
 * it becomes null and disappears from the admin's view.
 */
@Data
@AllArgsConstructor
public class SupervisorDetailDto {
    private Long id;
    private UserDto user;
    private String entity;
    private Integer maxInterns;
    private Integer currentInterns;
    private String pendingTemporaryPassword;
}
