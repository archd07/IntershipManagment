package com.internship.management.dto;

import com.internship.management.entity.TaskPriority;
import com.internship.management.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskDto {
    @NotBlank private String title;
    private String description;
    private LocalDateTime deadline;
    private TaskPriority priority;
    private TaskStatus status;
    private Long studentId; // required when created by a supervisor
}
