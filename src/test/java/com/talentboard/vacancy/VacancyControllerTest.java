package com.talentboard.vacancy;

import com.talentboard.config.SecurityConfig;
import com.talentboard.security.RestAccessDeniedHandler;
import com.talentboard.security.RestAuthenticationEntryPoint;
import com.talentboard.security.UserPrincipal;
import com.talentboard.user.Role;
import com.talentboard.user.User;
import com.talentboard.vacancy.dto.VacancyResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.talentboard.common.GlobalExceptionHandler;

import java.time.Instant;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VacancyController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
        GlobalExceptionHandler.class})
class VacancyControllerTest {

    private static final String VALID_BODY = """
            {
              "title": "Backend Engineer",
              "description": "Builds APIs",
              "area": "Engineering",
              "workModality": "REMOTE"
            }
            """;

    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private VacancyService vacancyService;

    @Test
    void anonymousCannotCreateVacancy() throws Exception {
        mockMvc.perform(post("/api/vacancies").contentType("application/json").content(VALID_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CANDIDATE")
    void candidateCannotCreateVacancy() throws Exception {
        mockMvc.perform(post("/api/vacancies").contentType("application/json").content(VALID_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void recruiterCanCreateVacancy() throws Exception {
        User recruiter = new User("Recruiter", "rec@test.com", "secret", Role.RECRUITER);
        recruiter.setId(2L);
        when(vacancyService.create(any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/vacancies")
                        .with(user(new UserPrincipal(recruiter)))
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isCreated());
    }

    private VacancyResponse sampleResponse() {
        return new VacancyResponse(1L, "Backend Engineer", "Builds APIs", "Engineering",
                WorkModality.REMOTE, null, null, LocalDate.now(), VacancyStatus.OPEN,
                2L, "Recruiter", Instant.now(), Instant.now());
    }
}
