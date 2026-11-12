/**
 * API Client — Universal SDUI (fetch wrapper)
 * BaseUrl /api/universal → mirrors UniversalClientController.java
 * Keep fetch native (no axios) — easy to swap later.
 */

export class ApiError extends Error {
  status: number
  body: string
  constructor(status: number, message: string, body: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type FetchImpl = typeof fetch

export interface ApiClientOptions {
  baseUrl?: string
  fetchImpl?: FetchImpl
}

export function createClient(opts: ApiClientOptions = {}) {
  const baseUrl = opts.baseUrl ?? '/api/universal/v1'
  const fetchImpl: FetchImpl = opts.fetchImpl ?? ((...args: Parameters<FetchImpl>) => fetch(...args) as ReturnType<FetchImpl>)

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path}`
    const res = await fetchImpl(url, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init
    })
    const text = await res.text()
    let json: unknown = null
    try { json = text ? JSON.parse(text) : null } catch { json = text }
    if (!res.ok) {
      // universal-service error contract: {errorDesc, errorCode, errorMessage}
      const msg = (json as Record<string, unknown>)?.errorMessage as string | undefined
        ?? (json as Record<string, unknown>)?.error as string | undefined
        ?? (json as Record<string, unknown>)?.message as string | undefined
        ?? text
        ?? `HTTP ${res.status}`
      throw new ApiError(res.status, msg, text)
    }
    return json as T
  }

  /** Raw response (status + parsed body + headers) — no throw on non-2xx; used for ETag/304 flows. */
  async function raw(path: string, init?: RequestInit): Promise<{ status: number; body: unknown; headers: Headers }> {
    const res = await fetchImpl(`${baseUrl}${path}`, init)
    const text = res.status === 304 ? '' : await res.text()
    let body: unknown = undefined
    try { body = text ? JSON.parse(text) : undefined } catch { body = text }
    return { status: res.status, body, headers: res.headers }
  }

  return {
    raw,
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
    request
  }
}

export const apiClient = createClient()
export type ApiClient = ReturnType<typeof createClient>
