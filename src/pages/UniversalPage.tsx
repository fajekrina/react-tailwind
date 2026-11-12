/**
 * UniversalPage — GENERIC page built purely from JSON
 * Loads GET /api/universal/client/page/{mid}/{key} via service-repo hook (ETag + last-good cache).
 * Navigation actions go through the SDUI NavigationPort wired to react-router.
 * Route: /:merchantId/:pageKey + ?merchant=&page= fallback (keep)
 */
import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Fajrina, type FajrinaActionEvent, type SduiPorts } from '@fajekrina/sdui/react'
import { useUniversalPage } from '../hooks/useUniversalPage'
import { resolveTarget } from '../utils/route'

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v != null) qs.set(k, String(v))
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export default function UniversalPage() {
  const { merchantId: paramMid, pageKey: paramKey } = useParams<{ merchantId: string; pageKey: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, error, source, loadPage, submitAction } = useUniversalPage()
  const { mid } = resolveTarget(paramMid, paramKey, location.search, location.pathname)

  useEffect(() => {
    const { mid, key, shouldRedirect } = resolveTarget(paramMid, paramKey, location.search, location.pathname)
    if (shouldRedirect) {
      navigate(shouldRedirect, { replace: true })
      return
    }
    loadPage(mid, key)
  }, [paramMid, paramKey, location.search, location.pathname, navigate, loadPage])

  // SDUI never guesses URLs: the app's router is the NavigationPort
  const ports = useMemo<SduiPorts>(() => ({
    navigation: {
      navigate: (target, params) => navigate(`/${mid}/${target}${toQuery(params)}`),
      back: () => navigate(-1),
      openExternal: (href) => { window.open(href, '_blank', 'noopener') }
    }
  }), [mid, navigate])

  const handleAction = async (ev: FajrinaActionEvent) => {
    // navigate/back/toast/modal/externalLink are handled by the library (ports + UI store);
    // field errors are rendered by the library — only `submit` needs the backend.
    if (ev.behavior === 'blocked') { console.warn('[sdui] blocked action', ev.data); return }
    if (ev.behavior !== 'submit') return
    try {
      const json = await submitAction('submit', ev.data, ev.params ?? { target: ev.target ?? 'home' })
      if (json.success && (json.navigateTo || json.target)) navigate(`/${mid}/${String(json.navigateTo ?? json.target)}`)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      {error ? <div className="m-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
      {source === 'cache' ? <div className="m-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">Offline — menampilkan versi tersimpan terakhir.</div> : null}
      <Fajrina data={data as never} ports={ports} onAction={handleAction} />
    </>
  )
}
