import { useAuthStore } from '@/store/authStore';

export const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Fetch wrapper that automatically attaches the JWT Bearer token for Admin endpoints.
 */
export async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? useAuthStore.getState().token : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${ADMIN_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
