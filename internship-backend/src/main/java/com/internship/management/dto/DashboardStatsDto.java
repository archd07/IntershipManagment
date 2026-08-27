package com.internship.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalRequests;
    private long acceptedRequests;
    private long pendingRequests;
    private long rejectedRequests;
    private long activeInterns;
    private long totalSupervisors;
    private long completedInternships;
    private long unresolvedComplaints;
}
