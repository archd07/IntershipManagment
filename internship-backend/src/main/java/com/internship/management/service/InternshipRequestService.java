package com.internship.management.service;

import com.internship.management.dto.AcceptResultDto;
import com.internship.management.dto.InternshipRequestDto;
import com.internship.management.entity.*;
import com.internship.management.repository.InternshipRequestRepository;
import com.internship.management.repository.StudentProfileRepository;
import com.internship.management.repository.SupervisorProfileRepository;
import com.internship.management.repository.UserRepository;
import com.internship.management.service.support.TempPasswordGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InternshipRequestService {

    private final InternshipRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final TempPasswordGenerator tempPasswordGenerator;

    // ---------- Student actions ----------

    public InternshipRequest createOrUpdateDraft(Long studentId, Long requestId, InternshipRequestDto dto) {
        User student = getUser(studentId);

        InternshipRequest request;
        if (requestId != null) {
            request = getOwnedRequest(requestId, studentId);
            if (request.getStatus() != RequestStatus.DRAFT) {
                throw new IllegalStateException("Seules les demandes en brouillon peuvent être modifiées");
            }
        } else {
            request = InternshipRequest.builder().student(student).status(RequestStatus.DRAFT).build();
        }

        request.setInternshipType(dto.getInternshipType());
        request.setStartDate(dto.getStartDate());
        request.setEndDate(dto.getEndDate());
        request.setSpecialty(dto.getSpecialty());

        // Duration is always derived from the dates, never entered directly.
        if (dto.getStartDate() != null && dto.getEndDate() != null && !dto.getEndDate().isBefore(dto.getStartDate())) {
            long days = ChronoUnit.DAYS.between(dto.getStartDate(), dto.getEndDate());
            request.setDurationInWeeks((int) Math.ceil(days / 7.0));
        }

        return requestRepository.save(request);
    }

    public InternshipRequest submit(Long studentId, Long requestId) {
        InternshipRequest request = getOwnedRequest(requestId, studentId);
        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new IllegalStateException("Seules les demandes en brouillon peuvent être soumises");
        }
        request.setStatus(RequestStatus.SUBMITTED);
        request.setSubmittedAt(LocalDateTime.now());
        InternshipRequest saved = requestRepository.save(request);

        notifyAdmins("Nouvelle demande de stage",
                request.getStudent().getFullName() + " a soumis une nouvelle demande de stage.",
                NotificationPriority.NORMAL, "REQUEST");

        return saved;
    }

    public List<InternshipRequest> getForStudent(Long studentId) {
        return requestRepository.findByStudentId(studentId);
    }

    // ---------- Admin actions ----------

    public List<InternshipRequest> getAll() {
        // Drafts belong only to the student until they submit — the admin should
        // never see them in the requests list.
        return requestRepository.findByStatusNot(RequestStatus.DRAFT);
    }

    public List<InternshipRequest> getByStatus(RequestStatus status) {
        return requestRepository.findByStatus(status);
    }

    public InternshipRequest getById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));
    }

    @Transactional
    public AcceptResultDto accept(Long requestId) {
        InternshipRequest request = getById(requestId);
        if (request.getStatus() != RequestStatus.SUBMITTED && request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Seules les demandes soumises ou en attente peuvent être acceptées");
        }

        String temporaryPassword = null;

        // Guest application (no account yet): create the student account now,
        // from the applicant snapshot captured at submission time.
        if (request.getStudent() == null) {
            if (userRepository.existsByEmail(request.getApplicantEmail())) {
                throw new IllegalStateException(
                        "Un compte existe déjà avec l'email de ce candidat. Contactez l'administration pour régulariser la demande.");
            }

            temporaryPassword = tempPasswordGenerator.generate();

            User newStudent = User.builder()
                    .firstName(request.getApplicantFirstName())
                    .lastName(request.getApplicantLastName())
                    .email(request.getApplicantEmail())
                    .phone(request.getApplicantPhone())
                    .password(passwordEncoder.encode(temporaryPassword))
                    .role(Role.STUDENT)
                    .mustChangePassword(true)
                    .pendingTemporaryPassword(temporaryPassword)
                    .build();
            newStudent = userRepository.save(newStudent);

            StudentProfile profile = StudentProfile.builder()
                    .user(newStudent)
                    .cin(request.getApplicantCin())
                    .university(request.getApplicantUniversity())
                    .school(request.getApplicantSchool())
                    .level(request.getApplicantLevel())
                    .academicYear(request.getApplicantAcademicYear())
                    .specialty(request.getSpecialty())
                    .build();
            studentProfileRepository.save(profile);

            request.setStudent(newStudent);
        }

        request.setStatus(RequestStatus.ACCEPTED);
        InternshipRequest saved = requestRepository.save(request);

        notificationService.notify(request.getStudent(), "Candidature acceptée",
                "Votre demande de stage a été acceptée. Un encadrant vous sera affecté prochainement.",
                NotificationPriority.HIGH, "REQUEST");

        return new AcceptResultDto(saved, temporaryPassword);
    }

    @Transactional
    public InternshipRequest reject(Long requestId, String reason) {
        InternshipRequest request = getById(requestId);
        if (request.getStatus() != RequestStatus.SUBMITTED && request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Seules les demandes soumises ou en attente peuvent être rejetées");
        }
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        InternshipRequest saved = requestRepository.save(request);

        boolean hasReason = reason != null && !reason.isBlank();

        // A rejected guest application never gets an account, so there's no
        // in-app notification to send — the applicant checks their status via
        // the public "track my application" page instead.
        if (request.getStudent() != null) {
            notificationService.notify(request.getStudent(), "Candidature rejetée",
                    hasReason
                            ? "Votre demande de stage a été rejetée. Motif : " + reason
                            : "Votre demande de stage a été rejetée.",
                    NotificationPriority.HIGH, "REQUEST");
        }

        return saved;
    }

    @Transactional
    public InternshipRequest assignSupervisor(Long requestId, Long supervisorId) {
        InternshipRequest request = getById(requestId);
        if (request.getStatus() != RequestStatus.ACCEPTED && request.getStatus() != RequestStatus.ASSIGNED) {
            throw new IllegalStateException("Un encadrant ne peut être affecté qu'à une demande acceptée");
        }

        // Re-confirming the same supervisor that's already assigned is a no-op —
        // without this guard, currentInterns would be incremented a second time
        // for the same student every time the admin re-submits the form with the
        // pre-selected (unchanged) supervisor, eventually causing false
        // "capacity reached" errors.
        if (request.getSupervisor() != null && request.getSupervisor().getId().equals(supervisorId)) {
            return request;
        }

        User supervisorUser = getUser(supervisorId);
        SupervisorProfile profile = supervisorProfileRepository.findByUserId(supervisorId)
                .orElseThrow(() -> new RuntimeException("Profil de l'encadrant introuvable"));

        // First assignment happens once; from then on this is a genuine
        // reassignment, so free up the previous supervisor's capacity first.
        if (request.getSupervisor() != null) {
            releaseSupervisorCapacity(request.getSupervisor().getId());
        }

        if (profile.getCurrentInterns() >= profile.getMaxInterns()) {
            throw new IllegalStateException("L'encadrant a atteint sa capacité maximale");
        }

        profile.setCurrentInterns(profile.getCurrentInterns() + 1);
        supervisorProfileRepository.save(profile);

        request.setSupervisor(supervisorUser);
        // The organizational entity follows the assigned supervisor — never chosen by the student.
        request.setEntity(profile.getEntity());
        request.setStatus(RequestStatus.ASSIGNED);
        InternshipRequest saved = requestRepository.save(request);

        notificationService.notify(request.getStudent(), "Encadrant affecté",
                "Vous avez été affecté(e) à " + supervisorUser.getFullName() + ".",
                NotificationPriority.NORMAL, "ASSIGNMENT");
        notificationService.notify(supervisorUser, "Nouveau stagiaire affecté",
                request.getStudent().getFullName() + " vous a été affecté(e).",
                NotificationPriority.NORMAL, "ASSIGNMENT");

        return saved;
    }

    @Transactional
    public InternshipRequest changeSupervisor(Long requestId, Long newSupervisorId) {
        return assignSupervisor(requestId, newSupervisorId);
    }

    @Transactional
    public void removeInternFromSupervisor(Long requestId) {
        InternshipRequest request = getById(requestId);
        if (request.getSupervisor() != null) {
            releaseSupervisorCapacity(request.getSupervisor().getId());
            request.setSupervisor(null);
            request.setEntity(null);
            request.setStatus(RequestStatus.ACCEPTED);
            requestRepository.save(request);

            notificationService.notify(request.getStudent(), "Affectation annulée",
                    "Votre affectation à un encadrant a été annulée. Votre demande reste acceptée en attente d'un nouvel encadrant.",
                    NotificationPriority.NORMAL, "ASSIGNMENT");
        }
    }

    @Transactional
    public InternshipRequest cancelAcceptance(Long requestId) {
        InternshipRequest request = getById(requestId);
        if (request.getSupervisor() != null) {
            releaseSupervisorCapacity(request.getSupervisor().getId());
            request.setSupervisor(null);
            request.setEntity(null);
        }
        request.setStatus(RequestStatus.PENDING);
        InternshipRequest saved = requestRepository.save(request);

        notificationService.notify(request.getStudent(), "Candidature remise en attente",
                "L'acceptation de votre demande de stage a été annulée. Votre demande est de nouveau en attente d'examen.",
                NotificationPriority.NORMAL, "REQUEST");

        return saved;
    }

    private void releaseSupervisorCapacity(Long supervisorId) {
        supervisorProfileRepository.findByUserId(supervisorId).ifPresent(p -> {
            p.setCurrentInterns(Math.max(0, p.getCurrentInterns() - 1));
            supervisorProfileRepository.save(p);
        });
    }

    // ---------- Supervisor actions ----------

    public List<InternshipRequest> getForSupervisor(Long supervisorId) {
        return requestRepository.findBySupervisorId(supervisorId);
    }

    @Transactional
    public InternshipRequest markCompleted(Long requestId) {
        InternshipRequest request = getById(requestId);
        request.setStatus(RequestStatus.COMPLETED);
        InternshipRequest saved = requestRepository.save(request);

        notificationService.notify(request.getStudent(), "Stage terminé",
                "Votre stage a été marqué comme terminé. Votre résultat et votre attestation seront bientôt disponibles.",
                NotificationPriority.NORMAL, "COMPLETION");

        if (request.getSupervisor() != null) {
            releaseSupervisorCapacity(request.getSupervisor().getId());
        }

        return saved;
    }

    // ---------- Helpers ----------

    private InternshipRequest getOwnedRequest(Long requestId, Long studentId) {
        InternshipRequest request = getById(requestId);
        if (!request.getStudent().getId().equals(studentId)) {
            throw new SecurityException("Cette demande n'appartient pas à l'étudiant courant");
        }
        return request;
    }

    private User getUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    private void notifyAdmins(String title, String message, NotificationPriority priority, String type) {
        userRepository.findByRole(Role.ADMIN)
                .forEach(admin -> notificationService.notify(admin, title, message, priority, type));
    }
}
