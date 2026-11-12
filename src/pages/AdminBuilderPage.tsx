/**
 * AdminBuilderPage — the @fajekrina/sdui Studio on universal-service spec screens.
 * Pick a screen (or start a new one), edit it, Save draft / Publish. The action editor
 * offers this app's allow-lists (screen keys, request and link names) — names, never URLs.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EditorDocument, SduiBuilder } from '@fajekrina/sdui/builder/react'
import { createScreenService, blankScreen, SCREEN_KEY } from '../services/screenService'
import { DEFAULT_MERCHANT, DEFAULT_SCREEN, ENDPOINTS, LINKS, assetURL } from '../sdui/config'

const REQUESTS = Object.keys(ENDPOINTS)
const LINK_NAMES = Object.keys(LINKS)

export default function AdminBuilderPage() {
  const service = useMemo(() => createScreenService(), [])
  const doc = useMemo(() => new EditorDocument(), [])
  const [merchantId, setMerchantId] = useState(DEFAULT_MERCHANT)
  const [screens, setScreens] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    try { setScreens(await service.list(merchantId)) } catch (e) { setNotice(`Daftar screen gagal dimuat: ${(e as Error).message}`) }
  }, [service, merchantId])
  useEffect(() => { void refresh() }, [refresh])

  const open = useCallback(async (key: string) => {
    try {
      doc.importJSON(await service.open(merchantId, key) as object)
      setCurrent(key)
      setNotice('')
    } catch (e) { setNotice(`Gagal membuka ${key}: ${(e as Error).message}`) }
  }, [doc, service, merchantId])
  // open the default screen once the list arrives
  useEffect(() => {
    if (!current && screens.length) void open(screens.includes(DEFAULT_SCREEN) ? DEFAULT_SCREEN : screens[0]!)
  }, [screens, current, open])

  const create = () => {
    const key = prompt('Key screen baru (huruf/angka/_, diawali huruf):', 'promoBanner')?.trim()
    if (!key) return
    if (!SCREEN_KEY.test(key)) { setNotice('Key tidak valid: huruf/angka/_ dan diawali huruf'); return }
    if (screens.includes(key)) { setNotice(`Screen "${key}" sudah ada`); return }
    service.forget(key)
    doc.importJSON(blankScreen(key))
    setCurrent(key)
    setNotice(`Screen baru "${key}" — belum tersimpan`)
  }

  // Studio shows "Saved ✔" / "Save failed: …"; an error thrown here is the failure message
  const onSave = async (payload: unknown) => {
    const result = await service.save(merchantId, payload)
    setCurrent(result.key)
    setNotice(result.unchanged ? 'Tidak ada perubahan' : '')
    await refresh()
  }
  const onPublish = async (payload: unknown) => {
    const result = await service.publish(merchantId, payload)
    setCurrent(result.key)
    setNotice(result.unchanged ? `Sudah terpublikasi (v${result.sequence})` : `Terpublikasi v${result.sequence} — buka /${merchantId}/${result.key}`)
    await refresh()
  }

  const field = 'h-8 rounded-md border border-slate-300 bg-white px-2 text-sm'
  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-sm">
        <strong>Builder</strong>
        <input className={field} value={merchantId} onChange={(e) => { setMerchantId(e.target.value.trim()); setCurrent('') }} aria-label="merchantId" />
        <select className={`${field} min-w-44`} value={current} onChange={(e) => void open(e.target.value)} aria-label="Screen">
          {screens.map((k) => <option key={k} value={k}>{k}</option>)}
          {current && !screens.includes(current) ? <option value={current}>{current} (baru)</option> : null}
        </select>
        <button className="h-8 rounded-md bg-indigo-600 px-3 text-white" onClick={create}>Screen baru</button>
        <span className="text-slate-500">{notice}</span>
        {current ? <a className="ml-auto text-indigo-600 hover:underline" href={`/${merchantId}/${current}`} target="_blank" rel="noreferrer">Lihat di klien →</a> : null}
      </div>
      <div className="min-h-0 flex-1 p-2">
        <SduiBuilder
          document={doc}
          title={current ? `${merchantId} / ${current}` : merchantId}
          screens={screens}
          requests={REQUESTS}
          links={LINK_NAMES}
          assetURL={assetURL}
          onSave={onSave}
          onPublish={onPublish}
        />
      </div>
    </div>
  )
}
