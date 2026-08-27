package com.internship.management.dto;

import com.internship.management.entity.EvaluationResult;
import lombok.Data;

@Data
public class EvaluationDto {
    private EvaluationResult overallResult;
    private Integer technicalPerformance;
    private Integer professionalBehavior;
    private Integer attendanceScore;
    private Integer qualityOfWork;
    private Integer autonomy;
    private Integer communication;
    private String finalComments;
}
