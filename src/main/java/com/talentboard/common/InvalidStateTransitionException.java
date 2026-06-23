package com.talentboard.common;

public class InvalidStateTransitionException extends BusinessRuleException {

    public InvalidStateTransitionException(String message) {
        super(message);
    }
}
