/**
 * Repository — Universal SDUI (data access only, no business logic)
 * Maps 1:1 to universal-service /api/universal/v1 (UniversalClientController / UniversalMerchantController)
 */
import { apiClient, type ApiClient } from '../api/client'
import type { PageResponse, UniversalPageConfig, UniversalComponent } from '@fajekrina/sdui'

export interface ActionPayload {
  action: string
  data?: Record<string, unknown>
  params?: Record<string, unknown>
}

export function createUniversalRepository(client: ApiClient = apiClient) {
  return {
    /** Published page with ETag revalidation: 304 = unchanged release (body omitted). */
    async fetchPublishedPage(merchantId: string, pageKey: string, opts: { etag?: string; signal?: AbortSignal } = {}): Promise<PageResponse> {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (opts.etag) headers['If-None-Match'] = `"${opts.etag}"`
      const res = await client.raw(`/client/page/${encodeURIComponent(merchantId)}/${encodeURIComponent(pageKey)}`, { headers, signal: opts.signal })
      const etag = res.headers.get('ETag')?.replace(/^W\//, '').replace(/"/g, '') || undefined
      return { status: res.status, body: res.body, etag: etag ?? (res.status === 304 ? opts.etag : undefined) }
    },
    submitAction(payload: ActionPayload): Promise<Record<string, unknown>> {
      return client.post<Record<string, unknown>>('/client/action/submit', payload)
    }
  }
}

export const universalRepository = createUniversalRepository()
export type UniversalRepository = ReturnType<typeof createUniversalRepository>

export interface DraftPage extends UniversalPageConfig { lockVersion?: number }
export interface PublishResult { releaseId: string; sequence: number; contentHash: string }
export interface ComponentTypes { components: Record<string, { props?: Record<string, unknown>; category?: string }> }

export function createUniversalMerchantRepository(client: ApiClient = apiClient) {
  return {
    listPages(merchantId: string): Promise<{ pages: string[]; count: number }> {
      return client.get(`/merchant/pages/${merchantId}`)
    },
    getDraft(merchantId: string, pageKey: string): Promise<DraftPage> {
      return client.get(`/merchant/pages/${merchantId}/${pageKey}`)
    },
    /** S1: send the monolith; the backend splits it into tree + script artefacts. */
    save(merchantId: string, pageKey: string, components: UniversalComponent[], lockVersion?: number) {
      return client.post(`/merchant/pages/${merchantId}/${pageKey}`, {
        pageId: `${merchantId}-${pageKey}`,
        pageKey,
        merchantId,
        layout: { components },
        ...(lockVersion != null ? { lockVersion } : {})
      })
    },
    publish(merchantId: string, pageKey: string): Promise<PublishResult> {
      return client.post(`/merchant/pages/${merchantId}/${pageKey}/publish`)
    },
    rollback(merchantId: string, pageKey: string, toSequence: number): Promise<PublishResult> {
      return client.post(`/merchant/pages/${merchantId}/${pageKey}/rollback?to=${toSequence}`)
    },
    releases(merchantId: string, pageKey: string): Promise<{ releases: Array<{ sequence: number; isActive: boolean; publishedAt: string; publishedBy: string }> }> {
      return client.get(`/merchant/releases/${merchantId}/${pageKey}`)
    },
    /** Builder palette from the backend registry (sdui_component_type). */
    componentTypes(): Promise<ComponentTypes> {
      return client.get('/merchant/component-types')
    }
  }
}

export const universalMerchantRepository = createUniversalMerchantRepository()
export type UniversalMerchantRepository = ReturnType<typeof createUniversalMerchantRepository>
