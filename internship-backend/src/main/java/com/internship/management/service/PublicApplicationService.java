package com.internship.management.service;

import com.internship.management.dto.PublicApplicationDto;
import com.internship.management.dto.PublicStatusDto;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.NotificationPriority;
import com.internship.management.entity.RequestStatus;
import com.internship.management.entity.Role;
import com.internship.management.repository.InternshipRequestRepository;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicApplicationService {

    private final InternshipRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public InternshipRequest submit(PublicApplicationDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException(
                    "Un compte existe déjà avec cet email. Veuillez vous connecter pour soumettre une nouvelle demande.");
        }

        InternshipRequest request = InternshipRequest.builder()
                .applicantFirstName(dto.getFirstName())
                .applicantLastName(dto.getLastName())
                .applicantEmail(dto.getEmail())
                .applicantPhone(dto.getPhone())
                .applicantCin(dto.getCin())
                .applicantUniversity(dto.getUniversity())
                .applicantSchool(dto.getSchool())
                .applicantLevel(dto.getLevel())
                .applicantAcademicYear(dto.getAcademicYear())
                .internshipType(dto.getInternshipType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .specialty(dto.getSpecialty())
                .status(RequestStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        if (dto.getStartDate() != null && dto.getEndDate() != null && !dto.getEndDate().isBefore(dto.getStartDate())) {
            long days = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate());
            request.setDurationInWeeks((int) Math.ceil(days / 7.0));
        }

        InternshipRequest saved = requestRepository.save(request);

        userRepository.findByRole(Role.ADMIN).forEach(admin ->
                notificationService.notify(admin, "Nouvelle demande de stage",
                        dto.getFirstName() + " " + dto.getLastName() + " a soumis une nouvelle demande de stage.",
                        NotificationPriority.NORMAL, "REQUEST"));

        return saved;
    }

    public List<PublicStatusDto> trackByEmail(String email) {
        return requestRepository.findByApplicantEmailIgnoreCaseOrderByCreatedAtDesc(email).stream()
                .map(r -> new PublicStatusDto(r.getId(), r.getInternshipType(), r.getStatus(), r.getRejectionReason(), r.getSubmittedAt()))
                .toList();
    }
}
