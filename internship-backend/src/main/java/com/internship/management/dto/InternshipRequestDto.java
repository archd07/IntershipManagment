package com.internship.management.dto;

import com.internship.management.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class InternshipRequestDto {
    private String internshipType;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    private String specialty;
    // durationInWeeks is calculated by the server from startDate/endDate — not sent by the client.
    // requestedEntity is NOT chosen by the student; it is set automatically by the
    // administrator's supervisor assignment (see InternshipRequestService.assignSupervisor).
    private RequestStatus status; // used only in responses
}
