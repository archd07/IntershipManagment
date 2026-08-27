package com.internship.management.dto;

import com.internship.management.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AttendanceDto {
    @NotNull private LocalDate date;
    @NotNull private AttendanceStatus status;
}
