package com.internship.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "internship_request_id", nullable = false, unique = true)
    private InternshipRequest internshipRequest;

    @Enumerated(EnumType.STRING)
    private EvaluationResult overallResult;

    private Integer technicalPerformance;   // 0-20 or 0-100 scale, org-defined
    private Integer professionalBehavior;
    private Integer attendanceScore;
    private Integer qualityOfWork;
    private Integer autonomy;
    private Integer communication;

    @Column(length = 2000)
    private String finalComments;

    // Once true, the evaluation can no longer be edited (EvaluationService
    // rejects further submit() calls) — the supervisor's assessment is final.
    @Builder.Default
    private boolean confirmed = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
