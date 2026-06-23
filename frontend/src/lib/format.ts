import type { ApplicationStatus, InterviewResult, VacancyStatus } from '../types';

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function salaryRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return 'Not disclosed';
  if (min != null && max != null) return `$${min} – $${max}`;
  return `$${min ?? max}`;
}

const VACANCY_COLORS: Record<VacancyStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  OPEN: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-amber-100 text-amber-700',
};

const APPLICATION_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-700',
  INTERVIEWED: 'bg-cyan-100 text-cyan-700',
  OFFERED: 'bg-teal-100 text-teal-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-700',
};

const INTERVIEW_COLORS: Record<InterviewResult, string> = {
  PENDING: 'bg-slate-100 text-slate-700',
  PASSED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

export function vacancyStatusColor(status: VacancyStatus): string {
  return VACANCY_COLORS[status];
}

export function applicationStatusColor(status: ApplicationStatus): string {
  return APPLICATION_COLORS[status];
}

export function interviewResultColor(result: InterviewResult): string {
  return INTERVIEW_COLORS[result];
}

// Allowed next states for an application, mirroring the backend state machine.
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  APPLIED: ['IN_REVIEW', 'INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
  IN_REVIEW: ['INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW_SCHEDULED: ['INTERVIEWED', 'REJECTED', 'WITHDRAWN'],
  INTERVIEWED: ['OFFERED', 'IN_REVIEW', 'REJECTED'],
  OFFERED: ['HIRED', 'REJECTED', 'WITHDRAWN'],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};
