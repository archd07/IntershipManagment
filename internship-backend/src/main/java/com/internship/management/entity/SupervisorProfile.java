package com.internship.management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "supervisor_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Organizational entity, e.g. Extraction, Treatment, Administration */
    private String entity;


    @Builder.Default
    private Integer maxInterns = 5;

    @Builder.Default
    private Integer currentInterns = 0;

    public Integer getAvailableCapacity() {
        return maxInterns - currentInterns;
    }
}
