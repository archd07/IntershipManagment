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
@RequestMapping("/api/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final InternshipRequestService requestService;
    private final AttendanceService attendanceService;
    private final TaskService taskService;
    private final EvaluationService evaluationService;
    private final SupervisorService supervisorService;
    private final CurrentUser currentUser;

    // ---- My interns ----

    @GetMapping("/interns")
    public List<InternshipRequest> myInterns() {
        return requestService.getForSupervisor(currentUser.get().getId());
    }

    @GetMapping("/profile")
    public SupervisorProfile myProfile() {
        return supervisorService.getProfile(currentUser.get().getId());
    }

    @PostMapping("/interns/{requestId}/complete")
    public InternshipRequest markInternshipCompleted(@PathVariable Long requestId) {
        return requestService.markCompleted(requestId);
    }

    // ---- Attendance ----

    @GetMapping("/interns/{studentId}/attendance")
    public List<Attendance> internAttendance(@PathVariable Long studentId) {
        return attendanceService.getForStudent(studentId);
    }

    // ---- Tasks (supervisor configures tasks for interns) ----

    @GetMapping("/tasks")
    public List<TaskItem> myAssignedTasks() {
        return taskService.getForSupervisor(currentUser.get().getId());
    }

    @PostMapping("/tasks")
    public TaskItem createTaskForIntern(@Valid @RequestBody TaskDto dto) {
        return taskService.createBySupervisor(currentUser.get(), dto);
    }

    @PostMapping("/tasks/bulk")
    public List<TaskItem> createTaskForAllInterns(@Valid @RequestBody TaskDto dto) {
        return taskService.createForAllInterns(currentUser.get(), dto);
    }

    // ---- Evaluation ----

    @PostMapping("/interns/{requestId}/evaluation")
    public Evaluation submitEvaluation(@PathVariable Long requestId, @Valid @RequestBody EvaluationDto dto) {
        return evaluationService.submit(requestId, dto);
    }

    @PostMapping("/interns/{requestId}/evaluation/confirm")
    public Evaluation confirmEvaluation(@PathVariable Long requestId) {
        return evaluationService.confirm(requestId);
    }

    @GetMapping("/interns/{requestId}/evaluation")
    public Evaluation getEvaluation(@PathVariable Long requestId) {
        return evaluationService.getForRequest(requestId);
    }
}
