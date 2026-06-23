package com.talentboard.application;

import com.talentboard.application.dto.JobApplicationRequest;
import com.talentboard.application.dto.JobApplicationResponse;
import com.talentboard.common.BusinessRuleException;
import com.talentboard.common.ResourceNotFoundException;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.vacancy.Vacancy;
import com.talentboard.vacancy.VacancyService;
import com.talentboard.vacancy.VacancyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final VacancyService vacancyService;

    @Transactional
    public JobApplicationResponse apply(JobApplicationRequest request, User candidate) {
        Vacancy vacancy = vacancyService.getEntityById(request.vacancyId());

        if (vacancy.getStatus() != VacancyStatus.OPEN) {
            throw new BusinessRuleException("Cannot apply to a vacancy that is not open");
        }
        if (jobApplicationRepository.existsByCandidateAndVacancy(candidate, vacancy)) {
            throw new BusinessRuleException("You have already applied to this vacancy");
        }

        JobApplication application = new JobApplication();
        application.setCandidate(candidate);
        application.setVacancy(vacancy);
        application.setComments(request.comments());
        return JobApplicationResponse.from(jobApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<JobApplicationResponse> list(User currentUser) {
        List<JobApplication> applications = currentUser.getRole() == Role.CANDIDATE
                ? jobApplicationRepository.findByCandidate(currentUser)
                : jobApplicationRepository.findAll();
        return applications.stream().map(JobApplicationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<JobApplicationResponse> listForVacancy(Long vacancyId) {
        return jobApplicationRepository.findByVacancyId(vacancyId).stream()
                .map(JobApplicationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public JobApplicationResponse getById(Long id, User currentUser) {
        JobApplication application = getVisibleEntity(id, currentUser);
        return JobApplicationResponse.from(application);
    }

    @Transactional
    public JobApplicationResponse updateStatus(Long id, ApplicationStatus newStatus, String comments) {
        JobApplication application = getEntityById(id);
        ApplicationStatusTransitionValidator.validateTransition(application.getStatus(), newStatus);
        application.setStatus(newStatus);
        if (comments != null && !comments.isBlank()) {
            application.setComments(comments);
        }
        return JobApplicationResponse.from(jobApplicationRepository.save(application));
    }

    public JobApplication getEntityById(Long id) {
        return jobApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id " + id));
    }

    public JobApplication getVisibleEntity(Long id, User currentUser) {
        JobApplication application = getEntityById(id);
        if (currentUser.getRole() == Role.CANDIDATE && !application.getCandidate().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only access your own applications");
        }
        return application;
    }

    // No-op if the application already moved past this point or is in a terminal state.
    @Transactional
    public void markInterviewScheduled(JobApplication application) {
        if (application.getStatus() == ApplicationStatus.APPLIED
                || application.getStatus() == ApplicationStatus.IN_REVIEW) {
            application.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
            jobApplicationRepository.save(application);
        }
    }
}
