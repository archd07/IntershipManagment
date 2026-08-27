package com.internship.management.dto;

import com.internship.management.entity.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/** Minimal, safe-to-expose status snapshot for the public "track my application" page. */
@Data
@AllArgsConstructor
public class PublicStatusDto {
    private Long id;
    private String internshipType;
    private RequestStatus status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
}
