package com.talentboard.vacancy.dto;

import com.talentboard.vacancy.Vacancy;
import com.talentboard.vacancy.VacancyStatus;
import com.talentboard.vacancy.WorkModality;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record VacancyResponse(
        Long id,
        String title,
        String description,
        String area,
        WorkModality workModality,
        BigDecimal minSalary,
        BigDecimal maxSalary,
        LocalDate publicationDate,
        VacancyStatus status,
        Long responsibleUserId,
        String responsibleUserName,
        Instant createdAt,
        Instant updatedAt
) {
    public static VacancyResponse from(Vacancy vacancy) {
        return new VacancyResponse(
                vacancy.getId(),
                vacancy.getTitle(),
                vacancy.getDescription(),
                vacancy.getArea(),
                vacancy.getWorkModality(),
                vacancy.getMinSalary(),
                vacancy.getMaxSalary(),
                vacancy.getPublicationDate(),
                vacancy.getStatus(),
                vacancy.getResponsibleUser().getId(),
                vacancy.getResponsibleUser().getFullName(),
                vacancy.getCreatedAt(),
                vacancy.getUpdatedAt());
    }
}
