package com.internship.management.repository;

import com.internship.management.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByInternshipRequestId(Long internshipRequestId);
    Optional<Attendance> findByStudentIdAndDate(Long studentId, java.time.LocalDate date);
}
