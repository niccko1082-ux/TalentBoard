package com.talentboard.config;

import com.talentboard.application.ApplicationStatus;
import com.talentboard.application.JobApplication;
import com.talentboard.application.JobApplicationRepository;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.user.UserRepository;
import com.talentboard.vacancy.Vacancy;
import com.talentboard.vacancy.VacancyRepository;
import com.talentboard.vacancy.VacancyStatus;
import com.talentboard.vacancy.WorkModality;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VacancyRepository vacancyRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = userRepository.save(
                new User("Admin Demo", "admin@talentboard.com", passwordEncoder.encode("Admin123!"), Role.ADMIN));
        User recruiter = userRepository.save(
                new User("Recruiter Demo", "recruiter@talentboard.com", passwordEncoder.encode("Recruiter123!"), Role.RECRUITER));
        User candidate = userRepository.save(
                new User("Candidate Demo", "candidate@talentboard.com", passwordEncoder.encode("Candidate123!"), Role.CANDIDATE));

        Vacancy backendRole = createVacancy(recruiter, "Backend Software Engineer",
                "Build and maintain TalentBoard's REST API using Spring Boot.", "Engineering",
                WorkModality.REMOTE, new BigDecimal("4000"), new BigDecimal("6000"), VacancyStatus.OPEN);
        createVacancy(recruiter, "Product Designer",
                "Design end-to-end recruitment workflows for TalentBoard users.", "Design",
                WorkModality.HYBRID, null, null, VacancyStatus.OPEN);
        createVacancy(recruiter, "HR Business Partner",
                "Partner with hiring managers across the organization.", "Human Resources",
                WorkModality.ON_SITE, null, null, VacancyStatus.DRAFT);

        JobApplication application = new JobApplication();
        application.setCandidate(candidate);
        application.setVacancy(backendRole);
        application.setStatus(ApplicationStatus.APPLIED);
        application.setComments("Excited about this opportunity.");
        jobApplicationRepository.save(application);
    }

    private Vacancy createVacancy(User responsible, String title, String description, String area,
                                   WorkModality modality, BigDecimal minSalary, BigDecimal maxSalary, VacancyStatus status) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(title);
        vacancy.setDescription(description);
        vacancy.setArea(area);
        vacancy.setWorkModality(modality);
        vacancy.setMinSalary(minSalary);
        vacancy.setMaxSalary(maxSalary);
        vacancy.setPublicationDate(LocalDate.now());
        vacancy.setStatus(status);
        vacancy.setResponsibleUser(responsible);
        return vacancyRepository.save(vacancy);
    }
}
