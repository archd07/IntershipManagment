package com.internship.management.service;

import com.internship.management.dto.DashboardStatsDto;
import com.internship.management.entity.ComplaintStatus;
import com.internship.management.entity.RequestStatus;
import com.internship.management.entity.Role;
import com.internship.management.repository.ComplaintRepository;
import com.internship.management.repository.InternshipRequestRepository;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final InternshipRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;

    public DashboardStatsDto getStats() {
        // Drafts aren't visible to the administration yet, so they're excluded from "total".
        long total = requestRepository.findByStatusNot(RequestStatus.DRAFT).size();
        long accepted = requestRepository.countByStatus(RequestStatus.ACCEPTED)
                + requestRepository.countByStatus(RequestStatus.ASSIGNED)
                + requestRepository.countByStatus(RequestStatus.IN_PROGRESS);
        long pending = requestRepository.countByStatus(RequestStatus.SUBMITTED)
                + requestRepository.countByStatus(RequestStatus.PENDING);
        long rejected = requestRepository.countByStatus(RequestStatus.REJECTED);
        long activeInterns = requestRepository.countByStatus(RequestStatus.ASSIGNED)
                + requestRepository.countByStatus(RequestStatus.IN_PROGRESS);
        long supervisors = userRepository.findByRole(Role.SUPERVISOR).size();
        long completed = requestRepository.countByStatus(RequestStatus.COMPLETED);
        long unresolvedComplaints = complaintRepository.findAll().stream()
                .filter(c -> c.getStatus() == ComplaintStatus.SUBMITTED || c.getStatus() == ComplaintStatus.UNDER_REVIEW)
                .count();

        return new DashboardStatsDto(total, accepted, pending, rejected, activeInterns, supervisors, completed, unresolvedComplaints);
    }
}
