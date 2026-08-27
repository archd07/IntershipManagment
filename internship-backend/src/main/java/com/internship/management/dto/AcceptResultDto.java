package com.internship.management.dto;

import com.internship.management.entity.InternshipRequest;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned when an administrator accepts a request. If the request came from
 * a guest application (no account yet), accepting it creates the student
 * account and temporaryPassword is populated so the admin can relay it —
 * this is the only time it is ever available in plain text. If the student
 * already had an account, temporaryPassword is null.
 */
@Data
@AllArgsConstructor
public class AcceptResultDto {
    private InternshipRequest request;
    private String temporaryPassword;
}
