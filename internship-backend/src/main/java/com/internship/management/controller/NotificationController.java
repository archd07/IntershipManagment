package com.internship.management.controller;

import com.internship.management.entity.Notification;
import com.internship.management.security.CurrentUser;
import com.internship.management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<Notification> myNotifications() {
        return notificationService.getForUser(currentUser.get().getId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount(currentUser.get().getId()));
    }

    @PatchMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        notificationService.delete(id);
    }
}
