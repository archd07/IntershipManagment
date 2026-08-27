package com.internship.management.service;

import com.internship.management.dto.SupervisorAccountDto;
import com.internship.management.dto.SupervisorCreateDto;
import com.internship.management.dto.SupervisorDetailDto;
import com.internship.management.dto.SupervisorOptionDto;
import com.internship.management.dto.UserDto;
import com.internship.management.entity.*;
import com.internship.management.repository.SupervisorProfileRepository;
import com.internship.management.repository.UserRepository;
import com.internship.management.service.support.TempPasswordGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupervisorService {

    private final UserRepository userRepository;
    private final SupervisorProfileRepository supervisorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final TempPasswordGenerator tempPasswordGenerator;

    @Transactional
    public SupervisorAccountDto create(SupervisorCreateDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Un compte avec cet email existe déjà");
        }

        String tempPassword = tempPasswordGenerator.generate();

        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .phone(dto.getPhone())
                .role(Role.SUPERVISOR)
                .mustChangePassword(true)
                .pendingTemporaryPassword(tempPassword)
                .build();
        user = userRepository.save(user);

        SupervisorProfile profile = SupervisorProfile.builder()
                .user(user)
                .entity(dto.getEntity())
                .maxInterns(dto.getMaxInterns())
                .currentInterns(0)
                .build();
        supervisorProfileRepository.save(profile);

        // Also left as an in-app notification for the supervisor to see once they
        // do log in — the plain password itself is only ever returned here, to
        // the admin, so they can relay it (no email sending in this app).
        notificationService.notify(user, "Bienvenue",
                "Votre compte encadrant a été créé. Utilisez le mot de passe temporaire fourni par l'administration pour vous connecter, puis changez-le.",
                NotificationPriority.NORMAL, "ACCOUNT");

        UserDto userDto = new UserDto(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhone(), user.getRole(), user.isMustChangePassword());

        return new SupervisorAccountDto(userDto, tempPassword);
    }

    /** Supervisor list for admin views and selection dropdowns — includes entity/capacity so the admin can see it while choosing. */
    public List<SupervisorOptionDto> getAll() {
        return supervisorProfileRepository.findAll().stream()
                .map(p -> new SupervisorOptionDto(
                        p.getUser().getId(),
                        p.getUser().getFirstName(),
                        p.getUser().getLastName(),
                        p.getUser().getEmail(),
                        p.getEntity(),
                        p.getCurrentInterns(),
                        p.getMaxInterns()))
                .toList();
    }

    public SupervisorProfile getProfile(Long userId) {
        return supervisorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profil de l'encadrant introuvable"));
    }

    /**
     * Admin-facing detail view. pendingTemporaryPassword stays populated until
     * the supervisor changes their password (AccountService clears it then),
     * so the admin can come back and still see/relay it later — not just once
     * right after creation.
     */
    public SupervisorDetailDto getDetailForAdmin(Long userId) {
        SupervisorProfile profile = getProfile(userId);
        User user = profile.getUser();
        UserDto userDto = new UserDto(user.getId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getPhone(), user.getRole(), user.isMustChangePassword());
        return new SupervisorDetailDto(profile.getId(), userDto, profile.getEntity(),
                profile.getMaxInterns(), profile.getCurrentInterns(), user.getPendingTemporaryPassword());
    }

    @Transactional
    public SupervisorDetailDto updateCapacity(Long userId, Integer maxInterns) {
        SupervisorProfile profile = getProfile(userId);
        profile.setMaxInterns(maxInterns);
        supervisorProfileRepository.save(profile);
        return getDetailForAdmin(userId);
    }
}
