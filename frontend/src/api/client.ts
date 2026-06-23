import type { ApiError } from '../types';
import { getAuthHeader } from './credentials';

// Empty base means same-origin "/api" (Vite dev proxy or nginx reverse proxy).
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiException extends Error {
  status: number;
  details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  // Override credentials (used by login before they are stored).
  authHeader?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const auth = options.authHeader ?? getAuthHeader();
  if (auth) headers['Authorization'] = auth;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err = data as ApiError | null;
    throw new ApiException(
      response.status,
      err?.message ?? err?.error ?? `Request failed (${response.status})`,
      err?.details ?? [],
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, authHeader?: string) => request<T>(path, { authHeader }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
