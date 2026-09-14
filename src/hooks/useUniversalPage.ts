/**
 * Hook — useUniversalPage (React best practice, slim)
 * No route resolve — pages handle route via utils/route.ts
 */
import { useState, useCallback } from 'react'
import { universalService, type UniversalService } from '../services/universalService'

export interface UseUniversalPageOptions {
  service?: UniversalService
}

export function useUniversalPage(opts: UseUniversalPageOptions = {}) {
  const service = opts.service ?? universalService

  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadPage = useCallback(async (mid: string, key: string) => {
    setLoading(true)
    setError(null)
    try {
      const page = await service.getPublishedPage(mid, key)
      setData(page)
    } catch (e) {
      const msg = String((e as Error).message)
      setError(msg)
      setData(service.toErrorPage(msg) as unknown)
    } finally {
      setLoading(false)
    }
  }, [service])

  const submitAction = useCallback(async (action: string, dataPayload?: Record<string, unknown>, params?: Record<string, unknown>) => {
    const res = await service.submitAction({ action, data: dataPayload, params })
    return res as Record<string, unknown>
  }, [service])

  return {
    data,
    error,
    loading,
    loadPage,
    submitAction,
    setError,
    setData
  }
}
