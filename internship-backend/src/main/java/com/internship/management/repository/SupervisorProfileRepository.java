package com.internship.management.repository;

import com.internship.management.entity.SupervisorProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupervisorProfileRepository extends JpaRepository<SupervisorProfile, Long> {
    Optional<SupervisorProfile> findByUserId(Long userId);
}
