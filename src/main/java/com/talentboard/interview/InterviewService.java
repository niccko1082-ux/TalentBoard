package com.talentboard.interview;

import com.talentboard.application.ApplicationStatus;
import com.talentboard.application.JobApplication;
import com.talentboard.application.JobApplicationService;
import com.talentboard.common.BusinessRuleException;
import com.talentboard.common.InvalidRequestException;
import com.talentboard.common.ResourceNotFoundException;
import com.talentboard.interview.dto.InterviewRequest;
import com.talentboard.interview.dto.InterviewResponse;
import com.talentboard.interview.dto.InterviewUpdateRequest;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private static final Set<ApplicationStatus> TERMINAL_STATUSES =
            EnumSet.of(ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN);

    private final InterviewRepository interviewRepository;
    private final JobApplicationService jobApplicationService;
    private final UserService userService;

    @Transactional
    public InterviewResponse create(InterviewRequest request, User currentUser) {
        JobApplication application = jobApplicationService.getEntityById(request.jobApplicationId());
        if (TERMINAL_STATUSES.contains(application.getStatus())) {
            throw new BusinessRuleException("Cannot schedule an interview for an application that has already concluded");
        }
        validateNotInThePast(request.date().atTime(request.time()));

        User interviewer = userService.getEntityById(request.interviewerId());
        if (interviewer.getRole() == Role.CANDIDATE) {
            throw new InvalidRequestException("The interviewer must be a recruiter or an administrator");
        }

        Interview interview = new Interview();
        interview.setJobApplication(application);
        interview.setDate(request.date());
        interview.setTime(request.time());
        interview.setType(request.type());
        interview.setInterviewer(interviewer);
        interview.setObservations(request.observations());

        Interview saved = interviewRepository.save(interview);
        jobApplicationService.markInterviewScheduled(application);
        return InterviewResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getById(Long id, User currentUser) {
        return InterviewResponse.from(getVisibleEntity(id, currentUser));
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> listForApplication(Long jobApplicationId, User currentUser) {
        jobApplicationService.getVisibleEntity(jobApplicationId, currentUser);
        return interviewRepository.findByJobApplicationId(jobApplicationId).stream()
                .map(InterviewResponse::from)
                .toList();
    }

    @Transactional
    public InterviewResponse update(Long id, InterviewUpdateRequest request) {
        Interview interview = getEntityById(id);
        validateNotInThePast(request.date().atTime(request.time()));
        interview.setDate(request.date());
        interview.setTime(request.time());
        interview.setType(request.type());
        interview.setResult(request.result());
        interview.setObservations(request.observations());
        return InterviewResponse.from(interviewRepository.save(interview));
    }

    private Interview getEntityById(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id " + id));
    }

    private Interview getVisibleEntity(Long id, User currentUser) {
        Interview interview = getEntityById(id);
        if (currentUser.getRole() == Role.CANDIDATE
                && !interview.getJobApplication().getCandidate().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You can only access interviews linked to your own applications");
        }
        return interview;
    }

    private void validateNotInThePast(LocalDateTime dateTime) {
        if (dateTime.isBefore(LocalDateTime.now())) {
            throw new InvalidRequestException("Interviews cannot be scheduled in the past");
        }
    }
}
