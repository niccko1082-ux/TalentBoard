package com.talentboard.user.dto;

import com.talentboard.user.Role;
import com.talentboard.user.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        boolean enabled,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
                user.isEnabled(), user.getCreatedAt());
    }
}
