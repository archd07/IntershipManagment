package com.internship.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore // never serialize the bcrypt hash, even accidentally via a nested relation
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Builder.Default
    private boolean enabled = true;

    // True right after an account is created by an admin (supervisor) or
    // automatically on acceptance (student) with a temporary password.
    // The frontend forces a password-change screen while this is true.
    @Builder.Default
    private boolean mustChangePassword = false;

    // The plain temporary password, kept ONLY until the account holder changes
    // it (AccountService.changePassword clears this). Lets the administrator
    // come back later and still see/relay it, instead of it being shown once
    // and lost. Never serialized directly from the entity — only exposed
    // through explicit admin-facing DTOs (SupervisorDetailDto, AdminRequestDetailDto).
    @JsonIgnore
    private String pendingTemporaryPassword;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
