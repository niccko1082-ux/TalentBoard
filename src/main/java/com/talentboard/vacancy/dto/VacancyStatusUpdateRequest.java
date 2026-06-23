package com.talentboard.vacancy.dto;

import com.talentboard.vacancy.VacancyStatus;
import jakarta.validation.constraints.NotNull;

public record VacancyStatusUpdateRequest(
        @NotNull VacancyStatus status
) {
}
