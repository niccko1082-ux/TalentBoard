// Type definitions mirroring the backend DTOs / enums.

export type Role = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export type WorkModality = 'ON_SITE' | 'REMOTE' | 'HYBRID';

export type VacancyStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export type ApplicationStatus =
  | 'APPLIED'
  | 'IN_REVIEW'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type InterviewType = 'PHONE_SCREENING' | 'TECHNICAL' | 'HR' | 'FINAL_ROUND';

export type InterviewResult = 'PENDING' | 'PASSED' | 'FAILED' | 'NO_SHOW' | 'CANCELLED';

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface Vacancy {
  id: number;
  title: string;
  description: string;
  area: string;
  workModality: WorkModality;
  minSalary: number | null;
  maxSalary: number | null;
  publicationDate: string;
  status: VacancyStatus;
  responsibleUserId: number;
  responsibleUserName: string;
  createdAt: string;
  updatedAt: string;
}

export interface VacancyRequest {
  title: string;
  description: string;
  area: string;
  workModality: WorkModality;
  minSalary?: number | null;
  maxSalary?: number | null;
}

export interface JobApplication {
  id: number;
  candidateId: number;
  candidateName: string;
  vacancyId: number;
  vacancyTitle: string;
  applicationDate: string;
  status: ApplicationStatus;
  comments: string | null;
}

export interface Interview {
  id: number;
  jobApplicationId: number;
  date: string;
  time: string;
  type: InterviewType;
  interviewerId: number;
  interviewerName: string;
  result: InterviewResult;
  observations: string | null;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: string[];
}
