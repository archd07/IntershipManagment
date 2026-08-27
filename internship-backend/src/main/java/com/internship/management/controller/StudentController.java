package com.internship.management.controller;

import com.internship.management.dto.*;
import com.internship.management.entity.*;
import com.internship.management.security.CurrentUser;
import com.internship.management.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final InternshipRequestService requestService;
    private final AttendanceService attendanceService;
    private final TaskService taskService;
    private final ComplaintService complaintService;
    private final CurrentUser currentUser;

    // ---- Internship requests ----

    @GetMapping("/requests")
    public List<InternshipRequest> myRequests() {
        return requestService.getForStudent(currentUser.get().getId());
    }

    @PostMapping("/requests")
    public InternshipRequest saveDraft(@Valid @RequestBody InternshipRequestDto dto) {
        return requestService.createOrUpdateDraft(currentUser.get().getId(), null, dto);
    }

    @PutMapping("/requests/{id}")
    public InternshipRequest updateDraft(@PathVariable Long id, @Valid @RequestBody InternshipRequestDto dto) {
        return requestService.createOrUpdateDraft(currentUser.get().getId(), id, dto);
    }

    @PostMapping("/requests/{id}/submit")
    public InternshipRequest submit(@PathVariable Long id) {
        return requestService.submit(currentUser.get().getId(), id);
    }

    // ---- Attendance (self-service calendar) ----

    @GetMapping("/attendance")
    public List<Attendance> myAttendance() {
        return attendanceService.getForStudent(currentUser.get().getId());
    }

    @PostMapping("/attendance")
    public Attendance recordAttendance(@RequestBody AttendanceDto dto, @RequestParam Long internshipRequestId) {
        User student = currentUser.get();
        InternshipRequest request = requestService.getById(internshipRequestId);
        return attendanceService.recordAttendance(student, request, dto);
    }

    // ---- Tasks ----

    @GetMapping("/tasks")
    public List<TaskItem> myTasks() {
        return taskService.getForStudent(currentUser.get().getId());
    }

    @PostMapping("/tasks")
    public TaskItem createTask(@Valid @RequestBody TaskDto dto) {
        return taskService.createByStudent(currentUser.get(), dto);
    }

    @PatchMapping("/tasks/{id}/status")
    public TaskItem updateTaskStatus(@PathVariable Long id, @RequestParam TaskStatus status) {
        return taskService.updateStatus(id, status);
    }

    // ---- Complaints ----

    @PostMapping("/complaints")
    public Complaint submitComplaint(@Valid @RequestBody ComplaintDto dto) {
        return complaintService.submit(currentUser.get(), dto);
    }

    @GetMapping("/complaints")
    public List<Complaint> myComplaints() {
        return complaintService.getForStudent(currentUser.get().getId());
    }
}
