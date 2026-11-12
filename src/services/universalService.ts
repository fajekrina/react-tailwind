/**
 * Service — Universal SDUI (business logic)
 * Page loading goes through the library loader (ETag revalidation + last-good cache +
 * re-validation), with this app's repository plugged in as the NetworkPort.
 */
import { universalRepository, type UniversalRepository, type ActionPayload } from '../repositories/universalRepository'
import { loadPage, resolvePorts, toErrorPage as buildErrorPage, type LoadResult, type StoragePort, type UniversalPageConfig } from '@fajekrina/sdui'
import { browserStorage } from '@fajekrina/sdui/browser'

export interface ServiceOptions {
  repository?: UniversalRepository
  storage?: StoragePort
}

export function createUniversalService(opts: ServiceOptions = {}) {
  const repo = opts.repository ?? universalRepository
  const ports = resolvePorts({
    network: { getPage: (req) => repo.fetchPublishedPage(req.merchantId, req.pageKey, { etag: req.etag, signal: req.signal }) },
    storage: opts.storage ?? browserStorage()
  })

  return {
    /** Never throws: `source` tells fresh / not-modified / cache (offline) / error. */
    loadPublishedPage(merchantId: string, pageKey: string, signal?: AbortSignal): Promise<LoadResult> {
      return loadPage({ merchantId, pageKey, signal }, { ports })
    },
    async submitAction(payload: ActionPayload): Promise<Record<string, unknown>> {
      return repo.submitAction(payload)
    },
    toErrorPage(message: string): UniversalPageConfig {
      return buildErrorPage(message)
    }
  }
}

export const universalService = createUniversalService()
export type UniversalService = ReturnType<typeof createUniversalService>
