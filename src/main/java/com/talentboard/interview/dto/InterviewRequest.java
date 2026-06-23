package com.talentboard.interview.dto;

import com.talentboard.interview.InterviewType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record InterviewRequest(
        @NotNull Long jobApplicationId,
        @NotNull LocalDate date,
        @NotNull LocalTime time,
        @NotNull InterviewType type,
        @NotNull Long interviewerId,
        String observations
) {
}
