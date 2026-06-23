package com.talentboard.application.dto;

import jakarta.validation.constraints.NotNull;

public record JobApplicationRequest(
        @NotNull Long vacancyId,
        String comments
) {
}
