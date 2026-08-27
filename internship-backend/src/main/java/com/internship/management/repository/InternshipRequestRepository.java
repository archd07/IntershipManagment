package com.internship.management.repository;

import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InternshipRequestRepository extends JpaRepository<InternshipRequest, Long> {
    List<InternshipRequest> findByStudentId(Long studentId);
    List<InternshipRequest> findBySupervisorId(Long supervisorId);
    List<InternshipRequest> findByStatus(RequestStatus status);
    List<InternshipRequest> findByStatusNot(RequestStatus status);
    List<InternshipRequest> findByApplicantEmailIgnoreCaseOrderByCreatedAtDesc(String applicantEmail);
    long countByStatus(RequestStatus status);
}
