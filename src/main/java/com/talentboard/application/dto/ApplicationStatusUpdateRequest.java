package com.talentboard.application.dto;

import com.talentboard.application.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record ApplicationStatusUpdateRequest(
        @NotNull ApplicationStatus status,
        String comments
) {
}
