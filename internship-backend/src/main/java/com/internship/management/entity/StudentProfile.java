package com.internship.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String cin;
    private String university;
    private String school;
    private String level;
    private String specialty;
    private String academicYear;
}
