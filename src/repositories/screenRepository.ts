/**
 * Repository — spec screens on universal-service (data access only, no business logic).
 * Client side mirrors ScreenClientController, builder side ScreenMerchantController.
 */
import { SduiError } from '@fajekrina/sdui'
import { apiClient, type ApiClient, type FetchImpl } from '../api/client'
import { API_BASE } from '../sdui/config'

export interface ScreenSummary { key: string; status: string; sequence?: number; lockVersion?: number }
export interface ScreenDraft { merchantId: string; key: string; status: string; lockVersion: number; activeSequence?: number; payload: unknown }
export interface SaveResult { message: string; key: string; lockVersion: number; unchanged: boolean }
export interface PublishResult { message: string; key: string; sequence: number; contentHash: string; signingKeyId?: string; unchanged: boolean; lockVersion: number }

/** Read the backend error contract {errorMessage, errorCode} into an SduiError. */
async function httpError(response: Response): Promise<SduiError> {
  try {
    const body = await response.json() as { errorMessage?: string; errorCode?: string }
    return SduiError.http(response.status, body.errorMessage, body.errorCode)
  } catch {
    return SduiError.http(response.status)
  }
}

export function createScreenRepository(client: ApiClient = apiClient, fetchImpl: FetchImpl = (...a) => fetch(...a)) {
  /** Raw bytes for the engine (it verifies, decodes and validates them). */
  async function bytes(path: string, signal?: AbortSignal, notFound?: () => SduiError): Promise<Uint8Array> {
    let response: Response
    try {
      response = await fetchImpl(`${API_BASE}${path}`, { headers: { Accept: 'application/json' }, signal })
    } catch {
      throw SduiError.network(null)
    }
    if (response.status === 404 && notFound) throw notFound()
    if (!response.ok) throw await httpError(response)
    return new Uint8Array(await response.arrayBuffer())
  }

  return {
    // client (engine)
    screenBytes(merchantId: string, key: string, signal?: AbortSignal) {
      return bytes(`/client/screen/${encodeURIComponent(merchantId)}/${encodeURIComponent(key)}`, signal, () => SduiError.unknownScreen(key))
    },
    manifestBytes(merchantId: string) {
      return bytes(`/client/manifest/${encodeURIComponent(merchantId)}`)
    },

    // builder
    list(merchantId: string): Promise<{ merchantId: string; screens: ScreenSummary[] }> {
      return client.get(`/merchant/screens/${encodeURIComponent(merchantId)}`)
    },
    draft(merchantId: string, key: string): Promise<ScreenDraft> {
      return client.get(`/merchant/screens/${encodeURIComponent(merchantId)}/${encodeURIComponent(key)}`)
    },
    save(merchantId: string, key: string, payload: unknown, lockVersion?: number): Promise<SaveResult> {
      return client.post(`/merchant/screens/${encodeURIComponent(merchantId)}/${encodeURIComponent(key)}`,
        { payload, ...(lockVersion != null ? { lockVersion } : {}) })
    },
    publish(merchantId: string, key: string): Promise<PublishResult> {
      return client.post(`/merchant/screens/${encodeURIComponent(merchantId)}/${encodeURIComponent(key)}/publish`)
    }
  }
}

export const screenRepository = createScreenRepository()
export type ScreenRepository = ReturnType<typeof createScreenRepository>
