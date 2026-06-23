package com.talentboard.vacancy;

import com.talentboard.common.ResourceNotFoundException;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.vacancy.dto.VacancyRequest;
import com.talentboard.vacancy.dto.VacancyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VacancyService {

    private final VacancyRepository vacancyRepository;

    @Transactional
    public VacancyResponse create(VacancyRequest request, User currentUser) {
        Vacancy vacancy = new Vacancy();
        applyRequest(vacancy, request);
        vacancy.setPublicationDate(LocalDate.now());
        vacancy.setStatus(VacancyStatus.OPEN);
        vacancy.setResponsibleUser(currentUser);
        return VacancyResponse.from(vacancyRepository.save(vacancy));
    }

    @Transactional(readOnly = true)
    public List<VacancyResponse> list(User currentUser) {
        return vacancyRepository.findAll().stream()
                .filter(vacancy -> isVisibleTo(vacancy, currentUser))
                .map(VacancyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VacancyResponse getById(Long id, User currentUser) {
        Vacancy vacancy = getVisibleEntity(id, currentUser);
        return VacancyResponse.from(vacancy);
    }

    @Transactional
    public VacancyResponse update(Long id, VacancyRequest request, User currentUser) {
        Vacancy vacancy = getEntityById(id);
        requireOwnerOrAdmin(vacancy, currentUser);
        applyRequest(vacancy, request);
        return VacancyResponse.from(vacancyRepository.save(vacancy));
    }

    @Transactional
    public VacancyResponse updateStatus(Long id, VacancyStatus status, User currentUser) {
        Vacancy vacancy = getEntityById(id);
        requireOwnerOrAdmin(vacancy, currentUser);
        vacancy.setStatus(status);
        return VacancyResponse.from(vacancyRepository.save(vacancy));
    }

    public Vacancy getEntityById(Long id) {
        return vacancyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vacancy not found with id " + id));
    }

    private Vacancy getVisibleEntity(Long id, User currentUser) {
        Vacancy vacancy = getEntityById(id);
        if (!isVisibleTo(vacancy, currentUser)) {
            throw new ResourceNotFoundException("Vacancy not found with id " + id);
        }
        return vacancy;
    }

    private boolean isVisibleTo(Vacancy vacancy, User currentUser) {
        if (currentUser.getRole() == Role.CANDIDATE) {
            return vacancy.getStatus() != VacancyStatus.DRAFT;
        }
        return true;
    }

    private void requireOwnerOrAdmin(Vacancy vacancy, User currentUser) {
        boolean isOwner = vacancy.getResponsibleUser().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.ADMIN && !isOwner) {
            throw new AccessDeniedException("Only the responsible recruiter or an administrator can modify this vacancy");
        }
    }

    private void applyRequest(Vacancy vacancy, VacancyRequest request) {
        vacancy.setTitle(request.title());
        vacancy.setDescription(request.description());
        vacancy.setArea(request.area());
        vacancy.setWorkModality(request.workModality());
        vacancy.setMinSalary(request.minSalary());
        vacancy.setMaxSalary(request.maxSalary());
    }
}
