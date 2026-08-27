package com.internship.management.service;

import com.internship.management.dto.AuthResponse;
import com.internship.management.dto.LoginRequest;
import com.internship.management.entity.User;
import com.internship.management.repository.UserRepository;
import com.internship.management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    // Accounts are never self-registered: a student's account is created
    // automatically when the administrator accepts their guest application
    // (see InternshipRequestService.accept), and supervisor/admin accounts are
    // created directly by the administrator (see SupervisorService).

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email ou mot de passe invalide"));
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.isMustChangePassword());
    }
}
