package com.internship.management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * The public "apply for an internship" form — no account required. If the
 * request is later accepted by an administrator, a student account is
 * created automatically from these fields.
 */
@Data
public class PublicApplicationDto {
    // Applicant identity / academic profile
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    @Email @NotBlank private String email;
    private String phone;
    private String cin;
    private String university;
    private String school;
    private String level;
    private String academicYear;

    // Internship request details
    private String internshipType;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    private String specialty;
}
