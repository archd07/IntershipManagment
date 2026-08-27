package com.internship.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordDto {
    @NotBlank private String currentPassword;
    @NotBlank @Size(min = 6, message = "Le nouveau mot de passe doit contenir au moins 6 caractères")
    private String newPassword;
}
