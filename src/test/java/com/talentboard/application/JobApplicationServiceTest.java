package com.talentboard.application;

import com.talentboard.application.dto.JobApplicationRequest;
import com.talentboard.common.BusinessRuleException;
import com.talentboard.common.InvalidStateTransitionException;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.vacancy.Vacancy;
import com.talentboard.vacancy.VacancyService;
import com.talentboard.vacancy.VacancyStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobApplicationServiceTest {

    @Mock
    private JobApplicationRepository jobApplicationRepository;
    @Mock
    private VacancyService vacancyService;
    @InjectMocks
    private JobApplicationService jobApplicationService;

    private User candidate;
    private Vacancy openVacancy;

    @BeforeEach
    void setUp() {
        candidate = new User("Candidate", "candidate@test.com", "secret", Role.CANDIDATE);
        candidate.setId(10L);
        openVacancy = new Vacancy();
        openVacancy.setId(1L);
        openVacancy.setStatus(VacancyStatus.OPEN);
    }

    @Test
    void rejectsApplicationToClosedVacancy() {
        openVacancy.setStatus(VacancyStatus.CLOSED);
        when(vacancyService.getEntityById(1L)).thenReturn(openVacancy);

        assertThatThrownBy(() -> jobApplicationService.apply(new JobApplicationRequest(1L, null), candidate))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not open");

        verify(jobApplicationRepository, never()).save(any());
    }

    @Test
    void rejectsDuplicateApplication() {
        when(vacancyService.getEntityById(1L)).thenReturn(openVacancy);
        when(jobApplicationRepository.existsByCandidateAndVacancy(candidate, openVacancy)).thenReturn(true);

        assertThatThrownBy(() -> jobApplicationService.apply(new JobApplicationRequest(1L, null), candidate))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already applied");

        verify(jobApplicationRepository, never()).save(any());
    }

    @Test
    void persistsValidApplication() {
        when(vacancyService.getEntityById(1L)).thenReturn(openVacancy);
        when(jobApplicationRepository.existsByCandidateAndVacancy(candidate, openVacancy)).thenReturn(false);
        when(jobApplicationRepository.save(any(JobApplication.class))).thenAnswer(invocation -> {
            JobApplication saved = invocation.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        var response = jobApplicationService.apply(new JobApplicationRequest(1L, "Interested"), candidate);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.status()).isEqualTo(ApplicationStatus.APPLIED);
        verify(jobApplicationRepository).save(any(JobApplication.class));
    }

    @Test
    void rejectsInvalidStatusTransition() {
        JobApplication application = new JobApplication();
        application.setId(5L);
        application.setStatus(ApplicationStatus.APPLIED);
        when(jobApplicationRepository.findById(5L)).thenReturn(java.util.Optional.of(application));

        assertThatThrownBy(() -> jobApplicationService.updateStatus(5L, ApplicationStatus.HIRED, null))
                .isInstanceOf(InvalidStateTransitionException.class);
    }
}
