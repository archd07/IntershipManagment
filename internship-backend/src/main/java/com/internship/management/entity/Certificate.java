package com.internship.management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "certificate")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "internship_request_id", nullable = false, unique = true)
    private InternshipRequest internshipRequest;

    @Column(unique = true)
    private String referenceNumber;

    private LocalDate issuedDate;

    /** Path/URL to the generated PDF file */
    private String filePath;
}
