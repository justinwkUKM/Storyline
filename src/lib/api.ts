export interface ApiRequestOptions extends RequestInit {
  skipJsonContentType?: boolean;
}

export function buildApiUrl(path: string) {
  type ViteEnv = Record<string, string | undefined> & { VITE_API_BASE_URL?: string };
  const env = (import.meta as unknown as { env?: ViteEnv }).env || {};
  const apiBase = (env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData || options.skipJsonContentType ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = !!contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  if (!isJson) {
    throw new Error('Server returned an invalid response format.');
  }

  return payload as T;
}
