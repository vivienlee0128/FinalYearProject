import { apiBaseUrl } from './config';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function withTimeout<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The request timed out. Check your connection and try again.')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
export async function apiRequest(path: string, accessToken: string, options: RequestInit = {}) {
  if (!apiBaseUrl) throw new Error('The attendance API URL is not configured.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(response.status, body.error || `Request failed (${response.status}).`);
    }
    return response;
  } finally { clearTimeout(timer); }
}
