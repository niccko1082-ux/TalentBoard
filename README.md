# TalentBoard

TalentBoard is a **full-stack** recruitment / selection-process management system.
It centralizes **job vacancies**, **candidates**, **applications** and **interviews**
in a single platform — a Spring Boot REST API plus a React single-page application —
replacing the disconnected mix of spreadsheets, e-mails and shared documents that
organizations typically use to run their hiring pipeline.

It covers the full life cycle of a selection process — from publishing a vacancy to
the final decision on each candidate — with role-based access control, business-rule
enforcement and end-to-end traceability of every application's state.

> **Repository layout:** the Spring Boot backend lives at the repository root; the
> React + TypeScript frontend lives in [`frontend/`](frontend). Both are containerized
> and orchestrated together with `docker compose`.

> **Live deployment:** **https://54-197-72-170.sslip.io** — deployed on AWS EC2 with
> Docker Compose, served over HTTPS by nginx with a trusted Let's Encrypt certificate
> (auto-renewing). See [Deployment](#deployment).

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Architecture & design decisions](#architecture--design-decisions)
3. [Domain model](#domain-model)
4. [Roles & permissions](#roles--permissions)
5. [Business rules](#business-rules)
6. [API endpoints](#api-endpoints)
7. [Installation](#installation)
8. [Running the application](#running-the-application)
9. [Deployment](#deployment)
10. [Frontend (React SPA)](#frontend-react-spa)
11. [Environment variables](#environment-variables)
12. [Test credentials](#test-credentials)
13. [Running the tests](#running-the-tests)
14. [Functional evidence](#functional-evidence)

---

## Tech stack

| Area            | Technology                                              |
|-----------------|---------------------------------------------------------|
| Language        | Java 21                                                  |
| Framework       | Spring Boot 4.1.0 (Spring Framework 7, Spring Security 7)|
| Persistence     | Spring Data JPA / Hibernate, PostgreSQL                  |
| Security        | Spring Security (HTTP Basic + method security)           |
| API docs        | springdoc-openapi (Swagger UI)                           |
| Build (backend) | Maven (wrapper included)                                 |
| Boilerplate     | Lombok                                                   |
| **Frontend**    | **React 18 + TypeScript, Vite, React Router, Tailwind CSS** |
| Containerization| Docker (multi-stage builds) + Docker Compose (app + frontend) |
| Web server (FE) | nginx (serves the SPA and reverse-proxies `/api`)        |
| Testing         | JUnit 5, Mockito, Spring Security Test                   |

---

## Architecture & design decisions

The codebase is organized **by feature** (vertical slices) rather than by technical
layer. Each domain — `user`, `auth`, `vacancy`, `application`, `interview` — owns its
entity, repository, service, controller and DTOs. Cross-cutting concerns live in
`common` (error handling), `config` (security, OpenAPI, seed data) and `security`
(authentication plumbing).

```
com.talentboard
├── common        ApiError, GlobalExceptionHandler, custom exceptions
├── config        SecurityConfig, OpenApiConfig, DataInitializer
├── security      CustomUserDetailsService, UserPrincipal, SecurityUtils,
│                 REST 401/403 handlers
├── user          User, Role, UserService, UserController, DTOs
├── auth          AuthController (register / me / logout), AuthService
├── vacancy       Vacancy, VacancyStatus, WorkModality, service, controller, DTOs
├── application   JobApplication, ApplicationStatus,
│                 ApplicationStatusTransitionValidator, service, controller, DTOs
└── interview     Interview, InterviewType, InterviewResult, service, controller, DTOs
```

Key decisions and **why**:

- **DTOs everywhere** — entities are never exposed directly; every controller speaks
  in request/response records. This decouples the API contract from the persistence
  model and prevents accidental leakage of fields such as password hashes.
- **HTTP Basic + stateless-friendly security** — the deliverable is a pure REST API
  consumed by tools/clients (Swagger UI, curl, a future SPA), so Basic auth keeps the
  contract simple and explorable. CSRF is disabled because there are no
  browser-session form posts; all access is authenticated per request. Passwords are
  stored with **BCrypt**.
- **Defense in depth on authorization** — coarse-grained rules are declared in the
  `SecurityFilterChain`, endpoint-level rules use `@PreAuthorize`, and *ownership*
  rules (a candidate may only see their own data) are enforced in the service layer
  against the authenticated principal.
- **Explicit application state machine** — `ApplicationStatusTransitionValidator`
  encodes the allowed transitions as a map, so an application can never jump to an
  illegal state (e.g. `APPLIED → HIRED`). This guarantees traceability of the process.
- **`open-in-view=false`** — the Open-Session-In-View anti-pattern is disabled; read
  endpoints that map lazy associations run inside `@Transactional(readOnly = true)`
  service methods, keeping transactions short and explicit.
- **Global exception handling** — `GlobalExceptionHandler` maps domain exceptions to
  consistent HTTP statuses and a single `ApiError` JSON shape
  (`404`, `409`, `400`, `403`, `401`, validation `400`).

---

## Domain model

| Entity           | Key fields                                                                                   |
|------------------|----------------------------------------------------------------------------------------------|
| **User**         | id, fullName, email *(unique)*, password *(BCrypt)*, role, enabled, createdAt                 |
| **Vacancy**      | id, title, description, area, workModality, minSalary, maxSalary, publicationDate, status, responsibleUser, createdAt, updatedAt |
| **JobApplication** | id, candidate, vacancy, applicationDate, status, comments — *unique (candidate, vacancy)*   |
| **Interview**    | id, jobApplication, date, time, type, interviewer, result, observations                      |

**Enums**

- `Role`: `ADMIN`, `RECRUITER`, `CANDIDATE`
- `WorkModality`: `ON_SITE`, `REMOTE`, `HYBRID`
- `VacancyStatus`: `DRAFT`, `OPEN`, `CLOSED`, `CANCELLED`
- `ApplicationStatus`: `APPLIED`, `IN_REVIEW`, `INTERVIEW_SCHEDULED`, `INTERVIEWED`, `OFFERED`, `HIRED`, `REJECTED`, `WITHDRAWN`
- `InterviewType`: `PHONE_SCREENING`, `TECHNICAL`, `HR`, `FINAL_ROUND`
- `InterviewResult`: `PENDING`, `PASSED`, `FAILED`, `NO_SHOW`, `CANCELLED`

**Application state machine**

```
APPLIED             → IN_REVIEW, INTERVIEW_SCHEDULED, REJECTED, WITHDRAWN
IN_REVIEW           → INTERVIEW_SCHEDULED, REJECTED, WITHDRAWN
INTERVIEW_SCHEDULED → INTERVIEWED, REJECTED, WITHDRAWN
INTERVIEWED         → OFFERED, IN_REVIEW, REJECTED
OFFERED             → HIRED, REJECTED, WITHDRAWN
HIRED / REJECTED / WITHDRAWN → (terminal)
```

Scheduling an interview automatically promotes an `APPLIED` / `IN_REVIEW`
application to `INTERVIEW_SCHEDULED`.

---

## Roles & permissions

| Capability                                   | ADMIN | RECRUITER | CANDIDATE |
|----------------------------------------------|:-----:|:---------:|:---------:|
| Self-register                                |   –   |     –     |  ✔ (public) |
| Manage users (CRUD)                          |   ✔   |     –     |     –     |
| Create / update vacancies, change status     |   ✔   |     ✔     |     –     |
| View vacancies                               |   ✔   |     ✔     | ✔ (non-draft) |
| Apply to a vacancy                           |   –   |     –     |     ✔     |
| View **all** applications / interviews        |   ✔   |     ✔     |     –     |
| View **own** applications / interviews        |   –   |     –     |     ✔     |
| Update application status                    |   ✔   |     ✔     |     –     |
| Schedule / update interviews                 |   ✔   |     ✔     |     –     |

> Recruiters can only modify vacancies they are responsible for (or any vacancy if
> they are an admin).

---

## Business rules

The following rules are enforced server-side (verified in the
[functional evidence](#functional-evidence) and the automated tests):

1. A candidate **cannot apply twice** to the same vacancy → `409 Conflict`
   (DB unique constraint + service check).
2. Applications **cannot be submitted to a closed/non-open vacancy** → `409 Conflict`.
3. Interviews **cannot be scheduled in the past** → `400 Bad Request`.
4. Users can only access information **authorized for their role** → `401 / 403`.
5. Candidates can only see **their own** applications and interviews → `403 Forbidden`.
6. Application status changes must follow the **state machine** → `409 Conflict`
   on an illegal transition.
7. Interviews cannot be scheduled for applications already in a terminal state.

---

## API endpoints

Base path: `/api` · Interactive docs: `/swagger-ui/index.html` · OpenAPI JSON: `/v3/api-docs`

| Method | Path                                   | Access                    |
|--------|----------------------------------------|---------------------------|
| POST   | `/api/auth/register`                   | Public (creates CANDIDATE)|
| GET    | `/api/auth/me`                         | Authenticated             |
| POST   | `/api/auth/logout`                     | Authenticated             |
| GET/POST | `/api/users`                         | ADMIN                     |
| GET/PUT/DELETE | `/api/users/{id}`              | ADMIN                     |
| GET    | `/api/vacancies`                       | Authenticated             |
| POST   | `/api/vacancies`                       | ADMIN, RECRUITER          |
| GET    | `/api/vacancies/{id}`                  | Authenticated             |
| PUT    | `/api/vacancies/{id}`                  | ADMIN, RECRUITER (owner)  |
| PATCH  | `/api/vacancies/{id}/status`           | ADMIN, RECRUITER (owner)  |
| GET    | `/api/vacancies/{id}/applications`     | ADMIN, RECRUITER          |
| POST   | `/api/applications`                    | CANDIDATE                 |
| GET    | `/api/applications`                    | Authenticated (filtered)  |
| GET    | `/api/applications/{id}`               | Authenticated (ownership) |
| PATCH  | `/api/applications/{id}/status`        | ADMIN, RECRUITER          |
| POST   | `/api/interviews`                      | ADMIN, RECRUITER          |
| GET    | `/api/interviews/{id}`                 | Authenticated (ownership) |
| PUT    | `/api/interviews/{id}`                 | ADMIN, RECRUITER          |
| GET    | `/api/applications/{id}/interviews`    | Authenticated (ownership) |

---

## Installation

### Prerequisites

- **Docker** + **Docker Compose** (recommended path), **or**
- **JDK 21** and the bundled Maven wrapper (`./mvnw`) for the local path.
- Network access to a **PostgreSQL** database.

```bash
git clone https://github.com/niccko1082-ux/TalentBoard.git
cd TalentBoard
```

---

## Running the application

### Option A — Docker Compose (recommended, full stack)

Both the backend and the React frontend are containerized (multi-stage builds) and
orchestrated with `compose.yaml`. The backend connects to the configured PostgreSQL
database and seeds demo data on first start; the frontend is served by nginx, which
also reverse-proxies `/api` to the backend (so the browser stays same-origin).

```bash
# Build the images and start both services
docker compose up --build

# (optional) override host ports if 8080 / 3000 are taken
APP_HOST_PORT=8095 FRONTEND_HOST_PORT=3000 docker compose up --build
```

| Service  | URL                                         |
|----------|---------------------------------------------|
| Frontend | `http://localhost:3000`                     |
| API      | `http://localhost:8080`                     |
| Swagger  | `http://localhost:8080/swagger-ui/index.html` |

### Option B — Backend only, local (Maven wrapper)

```bash
./mvnw spring-boot:run
# or build a jar and run it
./mvnw clean package
java -jar target/TalentBoard-0.0.1-SNAPSHOT.jar
```

Override the datasource with environment variables (see below) if you are not using
the default database.

See [Frontend (React SPA)](#frontend-react-spa) for running the frontend in dev mode.

---

## Deployment

The application is deployed on an **AWS EC2** instance (Ubuntu, Docker + Docker
Compose) and exposed over **HTTPS** at **https://54-197-72-170.sslip.io**.

- The hostname uses [sslip.io](https://sslip.io) (wildcard DNS that maps
  `54-197-72-170.sslip.io` → the instance's public IP `54.197.72.170`), which lets
  **Let's Encrypt** issue a trusted certificate without owning a domain.
- nginx (the frontend container) terminates TLS on **443**, redirects **80 → 443**,
  serves the SPA and reverse-proxies `/api` to the backend container.
- The certificate auto-renews via certbot using the **webroot** method
  (`/var/www/certbot`, served by nginx — no downtime on renewal).

### Reproduce the deployment

```bash
# On the server (Docker + docker compose v2 installed):
git clone https://github.com/niccko1082-ux/TalentBoard.git && cd TalentBoard
printf 'APP_HOST_PORT=8095\nFRONTEND_HOST_PORT=80\n' > .env

# 1) Start the stack (HTTP) so the build is ready
docker compose up -d --build

# 2) Issue the certificate (frontend briefly stopped to free port 80)
sudo apt-get install -y certbot
docker compose stop frontend
sudo certbot certonly --standalone -d <ip-with-dashes>.sslip.io \
  --non-interactive --agree-tos --register-unsafely-without-email
sudo mkdir -p /var/www/certbot

# 3) Bring the frontend up with the TLS overlay
docker compose -f compose.yaml -f compose.tls.yaml up -d
```

> **AWS Security Group** must allow inbound **80** (ACME challenge + redirect),
> **443** (HTTPS) and optionally **8095** (direct API / Swagger).

| Service          | URL                                                  |
|------------------|------------------------------------------------------|
| App (HTTPS)      | `https://54-197-72-170.sslip.io`                     |
| API / Swagger    | `https://54-197-72-170.sslip.io/swagger-ui/index.html` |
| API (direct)     | `http://54.197.72.170:8095` (if 8095 is open)        |

---

## Frontend (React SPA)

A single-page application built with **React 18 + TypeScript + Vite + Tailwind CSS**,
located in [`frontend/`](frontend). It consumes the REST API using HTTP Basic auth and
adapts its navigation and available actions to the signed-in user's role.

### Screens

- **Login / Register** — sign in (with one-click demo accounts) or self-register as a candidate.
- **Dashboard** — role-aware summary and quick actions.
- **Vacancies** — list, detail, create/edit (recruiter/admin), change status; candidates apply with an optional note.
- **Applications** — candidates track their own; recruiters/admins review all, advance the status (following the state machine) and schedule interviews.
- **Application detail** — interview list, schedule interview, set interview result.
- **Users** (admin) — create users with a role, enable/disable, delete.

### Structure

```
frontend/src
├── api/          fetch client (Basic auth), credential store, resource modules
├── auth/         AuthContext / useAuth
├── components/   Layout, ProtectedRoute, shared UI
├── lib/          formatting + status colors + state-machine map
├── pages/        Login, Register, Dashboard, Vacancies, Applications, Users
├── types/        TypeScript interfaces mirroring the backend DTOs
└── App.tsx       routes (role-guarded)
```

### Run in development

The Vite dev server proxies `/api` to the backend (`http://localhost:8080` by
default), so no CORS configuration is needed while developing.

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
# point the proxy at a different backend if needed:
VITE_BACKEND_URL=http://localhost:8095 npm run dev
```

Make sure the backend is running first (Option B above, or `docker compose up app`).

### Build / Docker

```bash
cd frontend
npm run build          # type-checks and produces dist/
```

In Docker the frontend is built and served by nginx; `nginx.conf` reverse-proxies
`/api` to the `app` container. The backend also has CORS enabled
(`APP_CORS_ALLOWED_ORIGINS`) for setups where the SPA calls the API cross-origin.

---

## Environment variables

| Variable                      | Default                                                | Description                              |
|-------------------------------|--------------------------------------------------------|------------------------------------------|
| `SPRING_DATASOURCE_URL`       | `jdbc:postgresql://54.197.72.170:5432/crudzaso_db`     | JDBC URL of the PostgreSQL database      |
| `SPRING_DATASOURCE_USERNAME`  | `crudzaso`                                             | Database user                            |
| `SPRING_DATASOURCE_PASSWORD`  | `0000`                                                | Database password                        |
| `SERVER_PORT`                 | `8080`                                                | Port the application listens on          |
| `APP_SEED_ENABLED`            | `true`                                                | Seed demo data on startup if DB is empty |
| `APP_CORS_ALLOWED_ORIGINS`    | `http://localhost:5173,http://localhost:4173,http://localhost:8090` | Comma-separated browser origins allowed by CORS |
| `APP_HOST_PORT`               | `8080`                                                | (Compose only) backend host port published |
| `FRONTEND_HOST_PORT`          | `3000`                                                | (Compose only) frontend host port published |

**Frontend build-time variables** (in `frontend/`, prefixed `VITE_`):

| Variable             | Default          | Description                                                        |
|----------------------|------------------|-------------------------------------------------------------------|
| `VITE_API_BASE_URL`  | *(empty)*        | API base URL; empty means same-origin `/api` (dev proxy / nginx)  |
| `VITE_BACKEND_URL`   | `http://localhost:8080` | (dev only) target the Vite `/api` proxy forwards to        |

> **Security note:** the default datasource values point at the database provided for
> this assessment. For any real deployment, override these via environment variables
> and **do not** commit real credentials to a public repository.

---

## Test credentials

Seeded automatically on first startup (when the database has no users):

| Role      | Email                        | Password        |
|-----------|------------------------------|-----------------|
| ADMIN     | `admin@talentboard.com`      | `Admin123!`     |
| RECRUITER | `recruiter@talentboard.com`  | `Recruiter123!` |
| CANDIDATE | `candidate@talentboard.com`  | `Candidate123!` |

Use them with HTTP Basic auth, e.g.:

```bash
curl -u admin@talentboard.com:Admin123! http://localhost:8080/api/auth/me
```

---

## Running the tests

```bash
./mvnw test
```

The suite (16 tests) covers:

- **Unit tests (Mockito):** business rules in `JobApplicationServiceTest`
  (duplicate application, closed vacancy, illegal status transition) and
  `InterviewServiceTest` (past-date rejection, terminal-state rejection,
  auto-promotion).
- **State-machine unit test:** `ApplicationStatusTransitionValidatorTest`.
- **Web slice (`@WebMvcTest` + Spring Security Test):** `VacancyControllerTest`
  verifies `401` for anonymous, `403` for a candidate, `201` for a recruiter.
- **Persistence slice (`@DataJpaTest`):** `JobApplicationRepositoryTest` verifies the
  `(candidate, vacancy)` unique constraint.

> Integration/slice tests use the same PostgreSQL database (seeding disabled, slice
> tests roll back), so a reachable database is required to run the full suite.

---

## Functional evidence

Captured live against the running API (HTTP Basic auth, real PostgreSQL).

**Authentication & security**

```text
GET /v3/api-docs                  -> HTTP 200      # OpenAPI available
GET /swagger-ui/index.html        -> HTTP 200      # Swagger UI available
GET /api/vacancies (no auth)      -> HTTP 401      # {"error":"Unauthorized", ...}
GET /api/auth/me  (candidate)     -> HTTP 200      # {"role":"CANDIDATE", ...}
POST /api/auth/register           -> HTTP 201      # new CANDIDATE created
```

**Role enforcement**

```text
POST /api/vacancies (recruiter)   -> HTTP 201      # vacancy created
POST /api/vacancies (candidate)   -> HTTP 403      # {"error":"Forbidden", ...}
```

**Business rules**

```text
POST /api/applications (candidate)            -> HTTP 201   status=APPLIED
POST /api/applications (same vacancy again)   -> HTTP 409   "You have already applied to this vacancy"
POST /api/applications (to CLOSED vacancy)    -> HTTP 409   "Cannot apply to a vacancy that is not open"
POST /api/interviews (future date)            -> HTTP 201   result=PENDING
GET  /api/applications/{id} after scheduling  -> status=INTERVIEW_SCHEDULED   # auto-promoted
POST /api/interviews (past date 2020-01-01)   -> HTTP 400   "Interviews cannot be scheduled in the past"
```

**Candidate data isolation**

```text
GET /api/applications/{other-candidate-id}    -> HTTP 403   "You are not allowed to access this resource"
GET /api/applications (candidate)             -> HTTP 200   only the candidate's own applications
```

**Containerized run (backend)**

```text
docker compose up --build        -> image talentboard-app built, container started
GET /swagger-ui/index.html       -> HTTP 200   (from inside the container)
GET /api/auth/me (admin)         -> HTTP 200   {"role":"ADMIN", ...}
```

**Full stack (frontend + backend via Docker Compose)**

```text
docker compose up --build        -> talentboard-frontend (nginx) + talentboard-app built & started
GET http://localhost:3000/                 -> HTTP 200   <title>TalentBoard</title>   (SPA served)
GET http://localhost:3000/api/vacancies    -> HTTP 401   (nginx proxies /api, unauthenticated)
GET http://localhost:3000/api/auth/me (recruiter) -> HTTP 200   {"role":"RECRUITER", ...}
POST http://localhost:3000/api/vacancies (recruiter) -> HTTP 201   vacancy created via the SPA origin
POST http://localhost:3000/api/applications (candidate) -> HTTP 201   status=APPLIED
POST http://localhost:3000/api/vacancies (candidate) -> HTTP 403   role enforced through the proxy
```
