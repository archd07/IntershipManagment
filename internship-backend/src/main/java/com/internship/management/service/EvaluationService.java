package com.internship.management.service;

import com.internship.management.dto.EvaluationDto;
import com.internship.management.entity.Evaluation;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.NotificationPriority;
import com.internship.management.entity.RequestStatus;
import com.internship.management.repository.EvaluationRepository;
import com.internship.management.repository.InternshipRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final InternshipRequestRepository requestRepository;
    private final NotificationService notificationService;

    @Transactional
    public Evaluation submit(Long internshipRequestId, EvaluationDto dto) {
        InternshipRequest request = requestRepository.findById(internshipRequestId)
                .orElseThrow(() -> new RuntimeException("Demande de stage introuvable"));

        Evaluation evaluation = evaluationRepository.findByInternshipRequestId(internshipRequestId)
                .orElse(Evaluation.builder().internshipRequest(request).build());

        if (evaluation.isConfirmed()) {
            throw new IllegalStateException("Cette évaluation a été confirmée et ne peut plus être modifiée");
        }

        evaluation.setOverallResult(dto.getOverallResult());
        evaluation.setTechnicalPerformance(dto.getTechnicalPerformance());
        evaluation.setProfessionalBehavior(dto.getProfessionalBehavior());
        evaluation.setAttendanceScore(dto.getAttendanceScore());
        evaluation.setQualityOfWork(dto.getQualityOfWork());
        evaluation.setAutonomy(dto.getAutonomy());
        evaluation.setCommunication(dto.getCommunication());
        evaluation.setFinalComments(dto.getFinalComments());

        return evaluationRepository.save(evaluation);
    }

    /**
     * Locks the evaluation permanently — after this, submit() will refuse any
     * further changes. Also marks the internship as completed, since a
     * confirmed evaluation is the final step of the workflow.
     */
    @Transactional
    public Evaluation confirm(Long internshipRequestId) {
        Evaluation evaluation = evaluationRepository.findByInternshipRequestId(internshipRequestId)
                .orElseThrow(() -> new RuntimeException("Évaluation introuvable — enregistrez-la d'abord"));

        if (evaluation.isConfirmed()) {
            throw new IllegalStateException("Cette évaluation est déjà confirmée");
        }

        evaluation.setConfirmed(true);
        Evaluation saved = evaluationRepository.save(evaluation);

        InternshipRequest request = evaluation.getInternshipRequest();
        request.setStatus(RequestStatus.COMPLETED);
        requestRepository.save(request);

        notificationService.notify(request.getStudent(), "Évaluation disponible",
                "Le résultat de l'évaluation de votre stage est maintenant disponible.",
                NotificationPriority.NORMAL, "EVALUATION");

        return saved;
    }

    public Evaluation getForRequest(Long internshipRequestId) {
        return evaluationRepository.findByInternshipRequestId(internshipRequestId)
                .orElseThrow(() -> new RuntimeException("Évaluation introuvable"));
    }
}
