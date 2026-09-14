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
  const baseUrl = opts.baseUrl ?? '/api/universal'
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
      const msg = (json as Record<string, unknown>)?.error as string | undefined
        ?? (json as Record<string, unknown>)?.message as string | undefined
        ?? text
        ?? `HTTP ${res.status}`
      throw new ApiError(res.status, msg, text)
    }
    return json as T
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'GET' }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
    request
  }
}

export const apiClient = createClient()
export type ApiClient = ReturnType<typeof createClient>
