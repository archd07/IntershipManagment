package com.internship.management.service;

import com.internship.management.dto.ChangePasswordDto;
import com.internship.management.entity.User;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void changePassword(User currentUser, ChangePasswordDto dto) {
        if (!passwordEncoder.matches(dto.getCurrentPassword(), currentUser.getPassword())) {
            throw new IllegalArgumentException("Le mot de passe actuel est incorrect");
        }
        currentUser.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        currentUser.setMustChangePassword(false);
        currentUser.setPendingTemporaryPassword(null); // no longer relevant — the admin should stop seeing it now
        userRepository.save(currentUser);
    }
}
