/**
 * UniversalPage — GENERIC page built purely from JSON demo
 * Hits API GET /api/universal/client/page/{mid}/{key} only via service-repo hook
 * Route: /:merchantId/:pageKey + ?merchant=&page= fallback (keep)
 */
import { useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Fajrina, type FajrinaActionEvent } from '@fajekrina/sdui/react'
import { useUniversalPage } from '../hooks/useUniversalPage'
import { resolveTarget } from '../utils/route'

export default function UniversalPage() {
  const { merchantId: paramMid, pageKey: paramKey } = useParams<{ merchantId: string; pageKey: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, error, loadPage, submitAction } = useUniversalPage()

  useEffect(() => {
    const { mid, key, shouldRedirect } = resolveTarget(paramMid, paramKey, location.search, location.pathname)
    if (shouldRedirect) {
      navigate(shouldRedirect, { replace: true })
      return
    }
    loadPage(mid, key)
  }, [paramMid, paramKey, location.search, location.pathname, navigate, loadPage])

  const handleAction = async (ev: FajrinaActionEvent) => {
    const { mid: currentMid } = resolveTarget(paramMid, paramKey, location.search, location.pathname)
    if (ev.behavior === 'navigate' && ev.target) {
      navigate(`/${currentMid}/${ev.target}`)
      return
    }
    if (ev.behavior || ev.action) {
      try {
        const json = await submitAction(
          ev.behavior ?? ev.action ?? '',
          ev.data as Record<string, unknown> | undefined,
          (ev.params as Record<string, unknown> | undefined) ?? ({ target: ev.target ?? 'home' } as Record<string, unknown>)
        )
        const ok = Boolean(json.success)
        if (ok && (json.navigateTo || json.target)) {
          const t = String((json.navigateTo ?? json.target) as string)
          navigate(`/${currentMid}/${t}`)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    // <div className="min-h-screen bg-white text-[#0f172a]">
    //   <div className="mx-auto max-w-[1100px] p-6">
    //     {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
        <Fajrina data={data as never} onAction={handleAction} />
      // </div>
    // </div>
  )
}
