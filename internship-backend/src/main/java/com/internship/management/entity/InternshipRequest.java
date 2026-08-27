package com.internship.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "internship_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InternshipRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    // Nullable: a guest application (submitted via the public "apply" form,
    // before any account exists) has no student yet. The student account is
    // created automatically — and this field populated — only when the
    // administrator accepts the request. Already-registered students (from a
    // prior accepted request) submit new requests while logged in, and this
    // is set immediately in that case.
    private User student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    private String internshipType;
    private Integer durationInWeeks;
    private LocalDate startDate;
    private LocalDate endDate;
    private String specialty;

    /** Organizational entity, assigned by the administrator based on the supervisor — not chosen by the student */
    private String entity;

    // ---- Guest applicant snapshot (only populated when student is null) ----
    // Captured at submission time from the public application form so the
    // administrator can review the request and, on acceptance, create the
    // matching student account from this data.
    private String applicantFirstName;
    private String applicantLastName;
    private String applicantEmail;
    private String applicantPhone;
    private String applicantCin;
    private String applicantUniversity;
    private String applicantSchool;
    private String applicantLevel;
    private String applicantAcademicYear;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RequestStatus status = RequestStatus.DRAFT;

    @Column(length = 1000)
    private String rejectionReason;

    private LocalDateTime submittedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /** Display name regardless of whether an account exists yet. */
    public String getApplicantDisplayName() {
        if (student != null) {
            return student.getFullName();
        }
        return (applicantFirstName != null ? applicantFirstName : "") + " " + (applicantLastName != null ? applicantLastName : "");
    }
}
