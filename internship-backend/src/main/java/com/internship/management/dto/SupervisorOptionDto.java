package com.internship.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Used to populate the supervisor list/selection dropdowns with their entity and current load visible. */
@Data
@AllArgsConstructor
public class SupervisorOptionDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String entity;
    private Integer currentInterns;
    private Integer maxInterns;
}
