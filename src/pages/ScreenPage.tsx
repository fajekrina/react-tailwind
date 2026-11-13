/**
 * ScreenPage — any spec screen of universal-service, rendered by the @fajekrina/sdui engine.
 * Route: /:merchantId/:screenKey?param=… — query params become the screen's seed data
 * (navigate params such as seatId), so `{{seatId}}` resolves.
 * Before each screen the version manifest is refreshed, so a just-published release shows.
 */
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SduiScreen } from '@fajekrina/sdui/react'
import type { SduiProps } from '@fajekrina/sdui'
import { createSduiEngine } from '../sdui/engine'
import { DEFAULT_MERCHANT, DEFAULT_SCREEN, specScreenKey } from '../sdui/config'

function toQuery(params: SduiProps): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== null && typeof v !== 'object') qs.set(k, String(v))
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export default function ScreenPage() {
  const { merchantId = DEFAULT_MERCHANT, screenKey = DEFAULT_SCREEN } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  const engine = useMemo(
    () => createSduiEngine({ merchantId, navigate: (key, params) => navigate(`/${merchantId}/${key}${toQuery(params)}`) }),
    [merchantId, navigate]
  )
  const seed = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search])

  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    setReady(false)
    engine.refreshManifest().catch((e) => console.warn('[sdui] manifest', e)).finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [engine, screenKey])

  // a 0.3.x URL (`/merchant_demo/seat-selection`) → the spec key, query kept
  const specKey = specScreenKey(screenKey)
  if (specKey !== screenKey) return <Navigate replace to={`/${merchantId}/${specKey}${search}`} />

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3 text-sm">
        <strong className="text-slate-900">SDUI Demo · React + Tailwind</strong>
        <span className="text-slate-500">{merchantId} / {screenKey}</span>
        <a href="/admin/builder" className="ml-auto text-indigo-600 hover:underline">Builder →</a>
      </header>
      <main className="mx-auto max-w-5xl">
        {ready ? <SduiScreen engine={engine} source={{ key: screenKey }} seed={seed} /> : null}
      </main>
    </div>
  )
}
