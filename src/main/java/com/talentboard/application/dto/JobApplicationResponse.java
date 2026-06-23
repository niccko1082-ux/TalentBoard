package com.talentboard.application.dto;

import com.talentboard.application.ApplicationStatus;
import com.talentboard.application.JobApplication;

import java.time.Instant;

public record JobApplicationResponse(
        Long id,
        Long candidateId,
        String candidateName,
        Long vacancyId,
        String vacancyTitle,
        Instant applicationDate,
        ApplicationStatus status,
        String comments
) {
    public static JobApplicationResponse from(JobApplication application) {
        return new JobApplicationResponse(
                application.getId(),
                application.getCandidate().getId(),
                application.getCandidate().getFullName(),
                application.getVacancy().getId(),
                application.getVacancy().getTitle(),
                application.getApplicationDate(),
                application.getStatus(),
                application.getComments());
    }
}
