package com.internship.management.service;

import com.internship.management.entity.Notification;
import com.internship.management.entity.NotificationPriority;
import com.internship.management.entity.User;
import com.internship.management.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification notify(User user, String title, String message, NotificationPriority priority, String type) {
        Notification n = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .priority(priority)
                .type(type)
                .build();
        return notificationRepository.save(n);
    }

    public List<Notification> getForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }
}
