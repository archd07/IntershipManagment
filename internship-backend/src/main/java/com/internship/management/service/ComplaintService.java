package com.internship.management.service;

import com.internship.management.dto.ComplaintDto;
import com.internship.management.entity.Complaint;
import com.internship.management.entity.ComplaintStatus;
import com.internship.management.entity.NotificationPriority;
import com.internship.management.entity.Role;
import com.internship.management.entity.User;
import com.internship.management.repository.ComplaintRepository;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Complaint submit(User student, ComplaintDto dto) {
        Complaint complaint = Complaint.builder()
                .student(student)
                .subject(dto.getSubject())
                .description(dto.getDescription())
                .build();
        Complaint saved = complaintRepository.save(complaint);

        userRepository.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.notify(admin, "Nouvelle réclamation",
                        student.getFullName() + " a soumis une réclamation : " + dto.getSubject(),
                        NotificationPriority.NORMAL, "COMPLAINT"));

        return saved;
    }

    public List<Complaint> getAll() {
        return complaintRepository.findAll();
    }

    public List<Complaint> getForStudent(Long studentId) {
        return complaintRepository.findByStudentId(studentId);
    }

    public Complaint updateStatus(Long id, ComplaintStatus status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        complaint.setStatus(status);
        if (status == ComplaintStatus.RESOLVED || status == ComplaintStatus.CLOSED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }
        return complaintRepository.save(complaint);
    }
}
