package com.talentboard.interview;

import com.talentboard.application.ApplicationStatus;
import com.talentboard.application.JobApplication;
import com.talentboard.application.JobApplicationService;
import com.talentboard.common.BusinessRuleException;
import com.talentboard.common.InvalidRequestException;
import com.talentboard.interview.dto.InterviewRequest;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private JobApplicationService jobApplicationService;
    @Mock
    private UserService userService;
    @InjectMocks
    private InterviewService interviewService;

    private User recruiter;
    private JobApplication application;

    @BeforeEach
    void setUp() {
        recruiter = new User("Recruiter", "rec@test.com", "secret", Role.RECRUITER);
        recruiter.setId(2L);
        application = new JobApplication();
        application.setId(7L);
        application.setStatus(ApplicationStatus.APPLIED);
    }

    @Test
    void rejectsInterviewInThePast() {
        when(jobApplicationService.getEntityById(7L)).thenReturn(application);
        InterviewRequest request = new InterviewRequest(7L, LocalDate.now().minusDays(1),
                LocalTime.of(10, 0), InterviewType.TECHNICAL, 2L, null);

        assertThatThrownBy(() -> interviewService.create(request, recruiter))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("past");

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void rejectsInterviewForConcludedApplication() {
        application.setStatus(ApplicationStatus.HIRED);
        when(jobApplicationService.getEntityById(7L)).thenReturn(application);
        InterviewRequest request = new InterviewRequest(7L, LocalDate.now().plusDays(2),
                LocalTime.of(10, 0), InterviewType.TECHNICAL, 2L, null);

        assertThatThrownBy(() -> interviewService.create(request, recruiter))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("concluded");

        verify(interviewRepository, never()).save(any());
    }

    @Test
    void schedulesValidInterviewAndPromotesApplication() {
        when(jobApplicationService.getEntityById(7L)).thenReturn(application);
        when(userService.getEntityById(2L)).thenReturn(recruiter);
        when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
            Interview saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });
        InterviewRequest request = new InterviewRequest(7L, LocalDate.now().plusDays(2),
                LocalTime.of(14, 30), InterviewType.HR, 2L, "First round");

        var response = interviewService.create(request, recruiter);

        org.assertj.core.api.Assertions.assertThat(response.id()).isEqualTo(42L);
        verify(interviewRepository).save(any(Interview.class));
        verify(jobApplicationService).markInterviewScheduled(application);
    }
}
