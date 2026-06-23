package com.talentboard.application;

import com.talentboard.application.dto.ApplicationStatusUpdateRequest;
import com.talentboard.application.dto.JobApplicationRequest;
import com.talentboard.application.dto.JobApplicationResponse;
import com.talentboard.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    @PostMapping("/api/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CANDIDATE')")
    public JobApplicationResponse apply(@Valid @RequestBody JobApplicationRequest request) {
        return jobApplicationService.apply(request, SecurityUtils.getCurrentUser());
    }

    @GetMapping("/api/applications")
    public List<JobApplicationResponse> listApplications() {
        return jobApplicationService.list(SecurityUtils.getCurrentUser());
    }

    @GetMapping("/api/applications/{id}")
    public JobApplicationResponse getApplication(@PathVariable Long id) {
        return jobApplicationService.getById(id, SecurityUtils.getCurrentUser());
    }

    @PatchMapping("/api/applications/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public JobApplicationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody ApplicationStatusUpdateRequest request) {
        return jobApplicationService.updateStatus(id, request.status(), request.comments());
    }

    @GetMapping("/api/vacancies/{vacancyId}/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public List<JobApplicationResponse> listForVacancy(@PathVariable Long vacancyId) {
        return jobApplicationService.listForVacancy(vacancyId);
    }
}
