package com.talentboard.application;

import com.talentboard.common.InvalidStateTransitionException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public final class ApplicationStatusTransitionValidator {

    private static final Map<ApplicationStatus, Set<ApplicationStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(ApplicationStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(ApplicationStatus.APPLIED,
                EnumSet.of(ApplicationStatus.IN_REVIEW, ApplicationStatus.INTERVIEW_SCHEDULED,
                        ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.IN_REVIEW,
                EnumSet.of(ApplicationStatus.INTERVIEW_SCHEDULED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.INTERVIEW_SCHEDULED,
                EnumSet.of(ApplicationStatus.INTERVIEWED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.INTERVIEWED,
                EnumSet.of(ApplicationStatus.OFFERED, ApplicationStatus.IN_REVIEW, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.OFFERED,
                EnumSet.of(ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.HIRED, EnumSet.noneOf(ApplicationStatus.class));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.REJECTED, EnumSet.noneOf(ApplicationStatus.class));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.WITHDRAWN, EnumSet.noneOf(ApplicationStatus.class));
    }

    private ApplicationStatusTransitionValidator() {
    }

    public static boolean canTransition(ApplicationStatus from, ApplicationStatus to) {
        return ALLOWED_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }

    public static void validateTransition(ApplicationStatus from, ApplicationStatus to) {
        if (from == to) {
            return;
        }
        if (!canTransition(from, to)) {
            throw new InvalidStateTransitionException(
                    "Cannot move application from " + from + " to " + to);
        }
    }
}
