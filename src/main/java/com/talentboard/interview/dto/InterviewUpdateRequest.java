package com.talentboard.interview.dto;

import com.talentboard.interview.InterviewResult;
import com.talentboard.interview.InterviewType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record InterviewUpdateRequest(
        @NotNull LocalDate date,
        @NotNull LocalTime time,
        @NotNull InterviewType type,
        @NotNull InterviewResult result,
        String observations
) {
}
