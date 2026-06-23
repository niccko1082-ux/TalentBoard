package com.talentboard.user;

import com.talentboard.common.BusinessRuleException;
import com.talentboard.common.ResourceNotFoundException;
import com.talentboard.user.dto.UpdateUserRequest;
import com.talentboard.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(String fullName, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException("A user with email " + email + " already exists");
        }
        User user = new User(fullName, email, passwordEncoder.encode(rawPassword), role);
        return userRepository.save(user);
    }

    public List<UserResponse> listAll() {

        return userRepository.findAll()
                .stream().map(UserResponse::from)
                .toList();
    }

    public UserResponse getById(Long id) {
        return UserResponse.from(getEntityById(id));
    }

    public User getEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = getEntityById(id);
        user.setFullName(request.fullName());
        user.setEnabled(request.enabled());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getEntityById(id);
        userRepository.delete(user);
    }
}
