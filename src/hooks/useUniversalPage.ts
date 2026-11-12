/**
 * Hook — useUniversalPage (React best practice, slim)
 * No route resolve — pages handle route via utils/route.ts
 */
import { useState, useCallback, useRef } from 'react'
import type { LoadResult } from '@fajekrina/sdui'
import { universalService, type UniversalService } from '../services/universalService'

export interface UseUniversalPageOptions {
  service?: UniversalService
}

export function useUniversalPage(opts: UseUniversalPageOptions = {}) {
  const service = opts.service ?? universalService

  const [data, setData] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<LoadResult['source'] | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const loadPage = useCallback(async (mid: string, key: string) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    const result = await service.loadPublishedPage(mid, key, ac.signal)
    if (ac.signal.aborted) return
    setData(result.page)
    setSource(result.source)
    setError(result.source === 'error' ? (result.errors[0]?.message ?? 'Failed to load page') : null)
    setLoading(false)
  }, [service])

  const submitAction = useCallback(async (action: string, dataPayload?: Record<string, unknown>, params?: Record<string, unknown>) => {
    return service.submitAction({ action, data: dataPayload, params })
  }, [service])

  return { data, error, source, loading, loadPage, submitAction, setError, setData }
}
