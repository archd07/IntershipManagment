package com.internship.management.repository;

import com.internship.management.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByInternshipRequestId(Long internshipRequestId);
}
