// Holds the HTTP Basic credentials used for every API call.
// Persisted to localStorage so a page refresh keeps the session.

import type { UserResponse } from '../types';

const TOKEN_KEY = 'talentboard.basic';
const USER_KEY = 'talentboard.user';

let basicToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setCredentials(email: string, password: string, user: UserResponse): void {
  basicToken = btoa(`${email}:${password}`);
  localStorage.setItem(TOKEN_KEY, basicToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCredentials(): void {
  basicToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeader(): string | null {
  return basicToken ? `Basic ${basicToken}` : null;
}

export function getStoredUser(): UserResponse | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserResponse) : null;
}

export function hasToken(): boolean {
  return basicToken !== null;
}
