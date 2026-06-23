import { api } from './client';
import type {
  ApplicationStatus,
  Interview,
  InterviewResult,
  InterviewType,
  JobApplication,
  UserResponse,
  Vacancy,
  VacancyRequest,
  VacancyStatus,
} from '../types';

// --- Auth ---
export const authApi = {
  me: (authHeader?: string) => api.get<UserResponse>('/api/auth/me', authHeader),
  register: (body: { fullName: string; email: string; password: string }) =>
    api.post<UserResponse>('/api/auth/register', body),
  logout: () => api.post<void>('/api/auth/logout'),
};

// --- Vacancies ---
export const vacancyApi = {
  list: () => api.get<Vacancy[]>('/api/vacancies'),
  get: (id: number) => api.get<Vacancy>(`/api/vacancies/${id}`),
  create: (body: VacancyRequest) => api.post<Vacancy>('/api/vacancies', body),
  update: (id: number, body: VacancyRequest) => api.put<Vacancy>(`/api/vacancies/${id}`, body),
  updateStatus: (id: number, status: VacancyStatus) =>
    api.patch<Vacancy>(`/api/vacancies/${id}/status`, { status }),
  applications: (id: number) => api.get<JobApplication[]>(`/api/vacancies/${id}/applications`),
};

// --- Applications ---
export const applicationApi = {
  list: () => api.get<JobApplication[]>('/api/applications'),
  get: (id: number) => api.get<JobApplication>(`/api/applications/${id}`),
  apply: (body: { vacancyId: number; comments?: string }) =>
    api.post<JobApplication>('/api/applications', body),
  updateStatus: (id: number, status: ApplicationStatus, comments?: string) =>
    api.patch<JobApplication>(`/api/applications/${id}/status`, { status, comments }),
  interviews: (id: number) => api.get<Interview[]>(`/api/applications/${id}/interviews`),
};

// --- Interviews ---
export const interviewApi = {
  get: (id: number) => api.get<Interview>(`/api/interviews/${id}`),
  create: (body: {
    jobApplicationId: number;
    date: string;
    time: string;
    type: InterviewType;
    interviewerId: number;
    observations?: string;
  }) => api.post<Interview>('/api/interviews', body),
  update: (
    id: number,
    body: {
      date: string;
      time: string;
      type: InterviewType;
      result: InterviewResult;
      observations?: string;
    },
  ) => api.put<Interview>(`/api/interviews/${id}`, body),
};

// --- Users (admin) ---
export const userApi = {
  list: () => api.get<UserResponse[]>('/api/users'),
  get: (id: number) => api.get<UserResponse>(`/api/users/${id}`),
  create: (body: { fullName: string; email: string; password: string; role: string }) =>
    api.post<UserResponse>('/api/users', body),
  update: (id: number, body: { fullName: string; enabled: boolean }) =>
    api.put<UserResponse>(`/api/users/${id}`, body),
  remove: (id: number) => api.del<void>(`/api/users/${id}`),
};
