package com.talentboard.application;

import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.user.UserRepository;
import com.talentboard.vacancy.Vacancy;
import com.talentboard.vacancy.VacancyRepository;
import com.talentboard.vacancy.VacancyStatus;
import com.talentboard.vacancy.WorkModality;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JobApplicationRepositoryTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VacancyRepository vacancyRepository;
    @Autowired
    private JobApplicationRepository jobApplicationRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    void preventsDuplicateApplicationForSameCandidateAndVacancy() {
        long unique = System.nanoTime();
        User recruiter = userRepository.save(
                new User("Recruiter", "rec-" + unique + "@test.com", "secret", Role.RECRUITER));
        User candidate = userRepository.save(
                new User("Candidate", "cand-" + unique + "@test.com", "secret", Role.CANDIDATE));
        Vacancy vacancy = vacancyRepository.save(buildVacancy(recruiter));

        jobApplicationRepository.save(buildApplication(candidate, vacancy));
        JobApplication duplicate = buildApplication(candidate, vacancy);

        assertThatThrownBy(() -> {
            jobApplicationRepository.save(duplicate);
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    private Vacancy buildVacancy(User responsible) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle("Backend Engineer");
        vacancy.setDescription("Builds APIs");
        vacancy.setArea("Engineering");
        vacancy.setWorkModality(WorkModality.REMOTE);
        vacancy.setPublicationDate(LocalDate.now());
        vacancy.setStatus(VacancyStatus.OPEN);
        vacancy.setResponsibleUser(responsible);
        return vacancy;
    }

    private JobApplication buildApplication(User candidate, Vacancy vacancy) {
        JobApplication application = new JobApplication();
        application.setCandidate(candidate);
        application.setVacancy(vacancy);
        application.setStatus(ApplicationStatus.APPLIED);
        return application;
    }
}
