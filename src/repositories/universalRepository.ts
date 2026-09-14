/**
 * Repository — Universal SDUI (data access only, no business logic)
 * Maps 1:1 to UniversalClientController.java
 */
import { apiClient, type ApiClient } from '../api/client'
import type { UniversalPageConfig } from '@fajekrina/sdui'

export interface ActionPayload {
  action: string
  data?: Record<string, unknown>
  params?: Record<string, unknown>
}

export function createUniversalRepository(client: ApiClient = apiClient) {
  return {
    getPublishedPage(merchantId: string, pageKey: string): Promise<UniversalPageConfig> {
      return client.get<UniversalPageConfig>(`/client/page/${merchantId}/${pageKey}`)
    },
    submitAction(payload: ActionPayload): Promise<Record<string, unknown>> {
      return client.post<Record<string, unknown>>('/client/action/submit', payload)
    }
  }
}

export const universalRepository = createUniversalRepository()
export type UniversalRepository = ReturnType<typeof createUniversalRepository>

export function createUniversalMerchantRepository(client: ApiClient = apiClient) {
  return {
    listPages(merchantId: string): Promise<{ pages: string[]; count: number }> {
      return client.get(`/merchant/pages/${merchantId}`)
    },
    getDraft(merchantId: string, pageKey: string): Promise<UniversalPageConfig> {
      return client.get(`/merchant/pages/${merchantId}/${pageKey}`)
    },
    save(merchantId: string, pageKey: string, components: unknown[]) {
      return client.post(`/merchant/pages/${merchantId}/${pageKey}`, {
        pageId: `${merchantId}-${pageKey}`,
        pageKey,
        merchantId,
        status: 'DRAFT',
        layout: { components }
      })
    },
    publish(merchantId: string, pageKey: string) {
      return client.post(`/merchant/pages/${merchantId}/${pageKey}/publish`)
    }
  }
}

export const universalMerchantRepository = createUniversalMerchantRepository()
export type UniversalMerchantRepository = ReturnType<typeof createUniversalMerchantRepository>
