package com.internship.management.controller;

import com.internship.management.dto.PublicApplicationDto;
import com.internship.management.dto.PublicStatusDto;
import com.internship.management.entity.InternshipRequest;
import com.internship.management.service.PublicApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Unauthenticated endpoints: submitting an internship application before any
 * account exists, and letting the applicant check its status by email
 * afterwards (they have no account/notifications to check it any other way
 * until — and unless — the request is accepted).
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicApplicationService publicApplicationService;

    @PostMapping("/apply")
    public InternshipRequest apply(@Valid @RequestBody PublicApplicationDto dto) {
        return publicApplicationService.submit(dto);
    }

    @GetMapping("/status")
    public List<PublicStatusDto> status(@RequestParam String email) {
        return publicApplicationService.trackByEmail(email);
    }
}
