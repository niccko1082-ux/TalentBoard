package com.talentboard.interview.dto;

import com.talentboard.interview.Interview;
import com.talentboard.interview.InterviewResult;
import com.talentboard.interview.InterviewType;

import java.time.LocalDate;
import java.time.LocalTime;

public record InterviewResponse(
        Long id,
        Long jobApplicationId,
        LocalDate date,
        LocalTime time,
        InterviewType type,
        Long interviewerId,
        String interviewerName,
        InterviewResult result,
        String observations
) {
    public static InterviewResponse from(Interview interview) {
        return new InterviewResponse(
                interview.getId(),
                interview.getJobApplication().getId(),
                interview.getDate(),
                interview.getTime(),
                interview.getType(),
                interview.getInterviewer().getId(),
                interview.getInterviewer().getFullName(),
                interview.getResult(),
                interview.getObservations());
    }
}
