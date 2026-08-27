package com.internship.management.repository;

import com.internship.management.entity.TaskItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskItemRepository extends JpaRepository<TaskItem, Long> {
    List<TaskItem> findByStudentId(Long studentId);
    List<TaskItem> findBySupervisorId(Long supervisorId);
}
