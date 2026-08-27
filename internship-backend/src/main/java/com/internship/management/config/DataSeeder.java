package com.internship.management.config;

import com.internship.management.entity.Role;
import com.internship.management.entity.User;
import com.internship.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("==============================================");
            System.out.println("   email:    admin@example.com");
            System.out.println("   password: admin123");
            System.out.println("==============================================");
        }
    }
}
