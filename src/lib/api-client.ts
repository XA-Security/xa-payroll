/**
 * Authenticated API client
 * Automatically includes user authentication headers with all requests
 */

/**
 * Get the current user ID from localStorage
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('xa_user');
    if (!stored) return null;

    const user = JSON.parse(stored);
    return user.id || null;
  } catch {
    return null;
  }
}

/**
 * Enhanced fetch that includes auth headers and credentials
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const userId = getUserId();

  const headers = new Headers(init?.headers);
  if (userId) {
    headers.set('x-user-id', userId);
  }

  // Convert relative URLs to absolute URLs for server-side calls
  let url = input;
  if (typeof window === 'undefined' && typeof input === 'string' && input.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3002';
    url = new URL(input, baseUrl).toString();
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
}

/**
 * Type-safe API client with automatic auth
 */
export const api = {
  async get<T>(url: string): Promise<T> {
    const response = await authFetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await authFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },

  async delete<T>(url: string): Promise<T> {
    const response = await authFetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  },
};
