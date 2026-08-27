package com.internship.management.repository;

import com.internship.management.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    Optional<Evaluation> findByInternshipRequestId(Long internshipRequestId);
}
