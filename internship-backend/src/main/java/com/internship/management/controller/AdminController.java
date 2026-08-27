package com.internship.management.controller;

import com.internship.management.dto.*;
import com.internship.management.entity.*;
import com.internship.management.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final InternshipRequestService requestService;
    private final SupervisorService supervisorService;
    private final ComplaintService complaintService;
    private final CertificateService certificateService;
    private final DashboardService dashboardService;

    // ---- Dashboard ----

    @GetMapping("/dashboard/stats")
    public DashboardStatsDto stats() {
        return dashboardService.getStats();
    }

    // ---- Requests ----

    @GetMapping("/requests")
    public List<InternshipRequest> allRequests(@RequestParam(required = false) RequestStatus status) {
        return status != null ? requestService.getByStatus(status) : requestService.getAll();
    }

    @GetMapping("/requests/{id}")
    public AdminRequestDetailDto getRequest(@PathVariable Long id) {
        InternshipRequest request = requestService.getById(id);
        String pendingTemporaryPassword = request.getStudent() != null
                ? request.getStudent().getPendingTemporaryPassword()
                : null;
        return new AdminRequestDetailDto(request, pendingTemporaryPassword);
    }

    @PostMapping("/requests/{id}/accept")
    public AcceptResultDto accept(@PathVariable Long id) {
        return requestService.accept(id);
    }

    @PostMapping("/requests/{id}/reject")
    public InternshipRequest reject(@PathVariable Long id, @RequestBody RejectRequestDto dto) {
        return requestService.reject(id, dto.getReason());
    }

    @PostMapping("/requests/{id}/assign-supervisor")
    public InternshipRequest assignSupervisor(@PathVariable Long id, @Valid @RequestBody AssignSupervisorDto dto) {
        return requestService.assignSupervisor(id, dto.getSupervisorId());
    }

    @PutMapping("/requests/{id}/change-supervisor")
    public InternshipRequest changeSupervisor(@PathVariable Long id, @Valid @RequestBody AssignSupervisorDto dto) {
        return requestService.changeSupervisor(id, dto.getSupervisorId());
    }

    @DeleteMapping("/requests/{id}/supervisor")
    public void removeIntern(@PathVariable Long id) {
        requestService.removeInternFromSupervisor(id);
    }

    @PostMapping("/requests/{id}/cancel-acceptance")
    public InternshipRequest cancelAcceptance(@PathVariable Long id) {
        return requestService.cancelAcceptance(id);
    }

    // ---- Supervisors ----

    @GetMapping("/supervisors")
    public List<SupervisorOptionDto> allSupervisors() {
        return supervisorService.getAll();
    }

    @PostMapping("/supervisors")
    public SupervisorAccountDto createSupervisor(@Valid @RequestBody SupervisorCreateDto dto) {
        return supervisorService.create(dto);
    }

    @GetMapping("/supervisors/{id}")
    public SupervisorDetailDto supervisorProfile(@PathVariable Long id) {
        return supervisorService.getDetailForAdmin(id);
    }

    @PatchMapping("/supervisors/{id}/capacity")
    public SupervisorDetailDto updateCapacity(@PathVariable Long id, @RequestParam Integer maxInterns) {
        return supervisorService.updateCapacity(id, maxInterns);
    }

    @GetMapping("/supervisors/{id}/interns")
    public List<InternshipRequest> supervisorInterns(@PathVariable Long id) {
        return requestService.getForSupervisor(id);
    }

    // ---- Complaints ----

    @GetMapping("/complaints")
    public List<Complaint> allComplaints() {
        return complaintService.getAll();
    }

    @PatchMapping("/complaints/{id}/status")
    public Complaint updateComplaintStatus(@PathVariable Long id, @RequestParam ComplaintStatus status) {
        return complaintService.updateStatus(id, status);
    }

    // ---- Certificates ----

    @PostMapping("/requests/{id}/certificate")
    public Certificate generateCertificate(@PathVariable Long id) {
        return certificateService.generate(id);
    }
}
