package com.talentboard.application;

import com.talentboard.user.User;
import com.talentboard.vacancy.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    boolean existsByCandidateAndVacancy(User candidate, Vacancy vacancy);

    List<JobApplication> findByCandidate(User candidate);

    List<JobApplication> findByVacancyId(Long vacancyId);
}
