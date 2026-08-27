package com.internship.management.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignSupervisorDto {
    @NotNull private Long supervisorId;
}
