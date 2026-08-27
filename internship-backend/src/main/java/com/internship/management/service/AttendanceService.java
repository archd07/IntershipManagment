package com.internship.management.service;

import com.internship.management.dto.AttendanceDto;
import com.internship.management.entity.Attendance;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.User;
import com.internship.management.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public Attendance recordAttendance(User student, InternshipRequest request, AttendanceDto dto) {
        Attendance attendance = attendanceRepository.findByStudentIdAndDate(student.getId(), dto.getDate())
                .orElse(Attendance.builder().student(student).internshipRequest(request).date(dto.getDate()).build());
        attendance.setStatus(dto.getStatus());
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getForStudent(Long studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    public List<Attendance> getForInternship(Long internshipRequestId) {
        return attendanceRepository.findByInternshipRequestId(internshipRequestId);
    }
}
