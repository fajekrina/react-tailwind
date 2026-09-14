/**
 * Service — Universal SDUI (business logic)
 * Wraps repository + maps UniversalPageConfigService.java handleAction → navigate target
 */
import { universalRepository, type UniversalRepository, type ActionPayload } from '../repositories/universalRepository'
import type { UniversalPageConfig } from '@fajekrina/sdui'

export interface ServiceOptions {
  repository?: UniversalRepository
}

export function createUniversalService(opts: ServiceOptions = {}) {
  const repo = opts.repository ?? universalRepository

  return {
    async getPublishedPage(merchantId: string, pageKey: string): Promise<UniversalPageConfig> {
      return repo.getPublishedPage(merchantId, pageKey)
    },
    async submitAction(payload: ActionPayload): Promise<Record<string, unknown>> {
      return repo.submitAction(payload)
    },
    /**
     * Helper: build fallback error page for render
     */
    toErrorPage(message: string): UniversalPageConfig {
      return {
        pageId: 'error',
        pageKey: 'error',
        merchantId: 'system',
        status: 'PUBLISHED',
        layout: {
          title: 'Not Found',
          subtitle: message,
          components: [{ type: 'Text', id: 'err', props: { content: message }, style: { color: '#ef4444' } } as unknown as Record<string, unknown>] as unknown as NonNullable<UniversalPageConfig['layout']>['components']
        }
      } as unknown as UniversalPageConfig
    }
  }
}

export const universalService = createUniversalService()
export type UniversalService = ReturnType<typeof createUniversalService>
