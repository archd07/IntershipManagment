package com.internship.management.controller;

import com.internship.management.dto.ChangePasswordDto;
import com.internship.management.dto.UserDto;
import com.internship.management.entity.Certificate;
import com.internship.management.entity.Evaluation;
import com.internship.management.entity.User;
import com.internship.management.security.CurrentUser;
import com.internship.management.service.AccountService;
import com.internship.management.service.CertificateService;
import com.internship.management.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints reachable by any authenticated user regardless of role,
 * e.g. viewing your own profile, or the result/certificate of a
 * request you're entitled to see (ownership is enforced at the
 * frontend route level for this scaffold; add ownership checks here
 * before production use).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommonController {

    private final CurrentUser currentUser;
    private final EvaluationService evaluationService;
    private final CertificateService certificateService;
    private final AccountService accountService;

    @GetMapping("/me")
    public UserDto me() {
        User u = currentUser.get();
        return new UserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPhone(), u.getRole(), u.isMustChangePassword());
    }

    @PutMapping("/me/password")
    public UserDto changePassword(@Valid @RequestBody ChangePasswordDto dto) {
        User u = currentUser.get();
        accountService.changePassword(u, dto);
        return new UserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPhone(), u.getRole(), u.isMustChangePassword());
    }

    @GetMapping("/requests/{id}/result")
    public Evaluation result(@PathVariable Long id) {
        return evaluationService.getForRequest(id);
    }

    @GetMapping("/requests/{id}/certificate")
    public Certificate certificate(@PathVariable Long id) {
        return certificateService.getForRequest(id);
    }

    @GetMapping("/requests/{id}/certificate/download")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable Long id) {
        Certificate certificate = certificateService.getForRequest(id);
        byte[] pdf = certificateService.getPdfBytes(id);
        String filename = "attestation-" + certificate.getReferenceNumber().replace("/", "-") + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }
}
