package com.internship.management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintDto {
    @NotBlank private String subject;
    private String description;
}
