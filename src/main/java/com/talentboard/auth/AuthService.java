package com.talentboard.auth;

import com.talentboard.auth.dto.RegisterRequest;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.user.UserService;
import com.talentboard.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;

    public UserResponse register(RegisterRequest request) {
        User user = userService.createUser(request.fullName(), request.email(), request.password(), Role.CANDIDATE);
        return UserResponse.from(user);
    }
}
