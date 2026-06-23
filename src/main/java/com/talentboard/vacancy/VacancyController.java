package com.talentboard.vacancy;

import com.talentboard.security.SecurityUtils;
import com.talentboard.vacancy.dto.VacancyRequest;
import com.talentboard.vacancy.dto.VacancyResponse;
import com.talentboard.vacancy.dto.VacancyStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacancies")
@RequiredArgsConstructor
public class VacancyController {

    private final VacancyService vacancyService;

    @GetMapping
    public List<VacancyResponse> listVacancies() {
        return vacancyService.list(SecurityUtils.getCurrentUser());
    }

    @GetMapping("/{id}")
    public VacancyResponse getVacancy(@PathVariable Long id) {
        return vacancyService.getById(id, SecurityUtils.getCurrentUser());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public VacancyResponse createVacancy(@Valid @RequestBody VacancyRequest request) {
        return vacancyService.create(request, SecurityUtils.getCurrentUser());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public VacancyResponse updateVacancy(@PathVariable Long id, @Valid @RequestBody VacancyRequest request) {
        return vacancyService.update(id, request, SecurityUtils.getCurrentUser());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
    public VacancyResponse updateStatus(@PathVariable Long id, @Valid @RequestBody VacancyStatusUpdateRequest request) {
        return vacancyService.updateStatus(id, request.status(), SecurityUtils.getCurrentUser());
    }
}
