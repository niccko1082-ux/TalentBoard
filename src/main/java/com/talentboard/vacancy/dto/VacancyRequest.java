package com.talentboard.vacancy.dto;

import com.talentboard.vacancy.WorkModality;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record VacancyRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String area,
        @NotNull WorkModality workModality,
        @PositiveOrZero BigDecimal minSalary,
        @PositiveOrZero BigDecimal maxSalary
) {
}
