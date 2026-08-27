package com.internship.management.service;

import com.internship.management.dto.TaskDto;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.entity.RequestStatus;
import com.internship.management.entity.TaskItem;
import com.internship.management.entity.User;
import com.internship.management.repository.InternshipRequestRepository;
import com.internship.management.repository.TaskItemRepository;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskItemRepository taskItemRepository;
    private final UserRepository userRepository;
    private final InternshipRequestRepository requestRepository;

    public TaskItem createByStudent(User student, TaskDto dto) {
        TaskItem task = TaskItem.builder()
                .student(student)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .deadline(dto.getDeadline())
                .priority(dto.getPriority() != null ? dto.getPriority() : com.internship.management.entity.TaskPriority.MEDIUM)
                .build();
        return taskItemRepository.save(task);
    }

    public TaskItem createBySupervisor(User supervisor, TaskDto dto) {
        User student = userRepository.findById(dto.getStudentId())
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));
        TaskItem task = TaskItem.builder()
                .student(student)
                .supervisor(supervisor)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .deadline(dto.getDeadline())
                .priority(dto.getPriority() != null ? dto.getPriority() : com.internship.management.entity.TaskPriority.MEDIUM)
                .build();
        return taskItemRepository.save(task);
    }

    /** Creates the same task for every intern currently assigned to this supervisor. */
    public List<TaskItem> createForAllInterns(User supervisor, TaskDto dto) {
        List<User> students = requestRepository.findBySupervisorId(supervisor.getId()).stream()
                .filter(r -> r.getStatus() == RequestStatus.ASSIGNED || r.getStatus() == RequestStatus.IN_PROGRESS)
                .map(InternshipRequest::getStudent)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (students.isEmpty()) {
            throw new IllegalStateException("Aucun stagiaire actif à qui assigner cette tâche");
        }

        return students.stream().map(student -> TaskItem.builder()
                .student(student)
                .supervisor(supervisor)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .deadline(dto.getDeadline())
                .priority(dto.getPriority() != null ? dto.getPriority() : com.internship.management.entity.TaskPriority.MEDIUM)
                .build()
        ).map(taskItemRepository::save).collect(Collectors.toList());
    }

    public TaskItem updateStatus(Long taskId, com.internship.management.entity.TaskStatus status) {
        TaskItem task = taskItemRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Tâche introuvable"));
        task.setStatus(status);
        return taskItemRepository.save(task);
    }

    public List<TaskItem> getForStudent(Long studentId) {
        return taskItemRepository.findByStudentId(studentId);
    }

    public List<TaskItem> getForSupervisor(Long supervisorId) {
        return taskItemRepository.findBySupervisorId(supervisorId);
    }
}
