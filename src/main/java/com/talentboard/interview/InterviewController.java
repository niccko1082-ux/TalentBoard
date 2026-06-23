package com.talentboard.interview;

import com.talentboard.interview.dto.InterviewRequest;
import com.talentboard.interview.dto.InterviewResponse;
import com.talentboard.interview.dto.InterviewUpdateRequest;
import com.talentboard.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/api/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public InterviewResponse create(@Valid @RequestBody InterviewRequest request) {
        return interviewService.create(request, SecurityUtils.getCurrentUser());
    }

    @GetMapping("/api/interviews/{id}")
    public InterviewResponse getInterview(@PathVariable Long id) {
        return interviewService.getById(id, SecurityUtils.getCurrentUser());
    }

    @GetMapping("/api/applications/{applicationId}/interviews")
    public List<InterviewResponse> listForApplication(@PathVariable Long applicationId) {
        return interviewService.listForApplication(applicationId, SecurityUtils.getCurrentUser());
    }

    @PutMapping("/api/interviews/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public InterviewResponse update(@PathVariable Long id, @Valid @RequestBody InterviewUpdateRequest request) {
        return interviewService.update(id, request);
    }
}
