package com.talentboard.application;

import com.talentboard.common.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class ApplicationStatusTransitionValidatorTest {

    @Test
    void allowsValidForwardTransition() {
        assertThat(ApplicationStatusTransitionValidator
                .canTransition(ApplicationStatus.APPLIED, ApplicationStatus.IN_REVIEW)).isTrue();
        assertThat(ApplicationStatusTransitionValidator
                .canTransition(ApplicationStatus.OFFERED, ApplicationStatus.HIRED)).isTrue();
    }

    @Test
    void rejectsInvalidTransition() {
        assertThatThrownBy(() -> ApplicationStatusTransitionValidator
                .validateTransition(ApplicationStatus.APPLIED, ApplicationStatus.HIRED))
                .isInstanceOf(InvalidStateTransitionException.class);
    }

    @Test
    void terminalStatusesHaveNoOutgoingTransitions() {
        assertThat(ApplicationStatusTransitionValidator
                .canTransition(ApplicationStatus.HIRED, ApplicationStatus.IN_REVIEW)).isFalse();
        assertThat(ApplicationStatusTransitionValidator
                .canTransition(ApplicationStatus.REJECTED, ApplicationStatus.APPLIED)).isFalse();
    }

    @Test
    void sameStatusIsANoOp() {
        assertThatCode(() -> ApplicationStatusTransitionValidator
                .validateTransition(ApplicationStatus.IN_REVIEW, ApplicationStatus.IN_REVIEW))
                .doesNotThrowAnyException();
    }
}
