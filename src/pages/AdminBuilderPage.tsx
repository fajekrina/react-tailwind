import { useState, useEffect } from 'react'
import { FajrinaBuilder } from '@fajekrina/sdui/builder/react'
import { universalMerchantRepository } from '../repositories/universalRepository'
import type { UniversalComponent } from '@fajekrina/sdui'

export default function AdminBuilderPage() {
  const [merchantId, setMerchantId] = useState('merchant_demo')
  const [pageKey, setPageKey] = useState('')
  const [pages, setPages] = useState<string[]>([])
  const [data, setData] = useState<unknown>(null)
  const [status, setStatus] = useState('')
  const [lockVersion, setLockVersion] = useState<number | undefined>(undefined)
  const [registry, setRegistry] = useState<Record<string, {props?: Record<string, unknown>}>|undefined>(undefined)

  // palette = backend registry (sdui_component_type); without it the builder falls back to the core registry
  useEffect(() => {
    universalMerchantRepository.componentTypes().then(j => setRegistry(j.components)).catch(() => setRegistry(undefined))
  }, [])

  // load page list, default to home
  const loadPages = async (mid: string) => {
    try {
      const res = await universalMerchantRepository.listPages(mid)
      const list = res.pages ?? []
      setPages(list)
      if (!list.includes(pageKey) && list.includes('home')) setPageKey('home')
      else if (!list.includes(pageKey) && list.length) setPageKey(list[0])
    } catch { setPages([]) }
  }
  useEffect(() => { loadPages(merchantId) }, [merchantId])

  // load draft when pageKey selected
  useEffect(() => {
    if (!pageKey) return
    // if pageKey is unsaved temp (not in pages), show empty draft locally — hilang saat refresh
    if (pages.length && !pages.includes(pageKey)) {
      setData({ layout: { components: [] } } as unknown)
      return
    }
    universalMerchantRepository.getDraft(merchantId, pageKey).then(d => { setData(d); setLockVersion(d.lockVersion) }).catch(() => {})
  }, [merchantId, pageKey, pages])

  const handleNew = async () => {
    const input = prompt('Nama page baru (huruf/angka/_/-):', 'my-page')
    if (!input) return
    const key = input.trim()
    if (!key) { setStatus('PageKey wajib diisi'); setTimeout(()=>setStatus(''),3000); return }
    if (!/^[a-z0-9_-]+$/i.test(key)) { setStatus('PageKey hanya huruf/angka/_/-'); setTimeout(()=>setStatus(''),3000); return }
    // uniq check — harus belum ada di backend
    try {
      const { pages: list } = await universalMerchantRepository.listPages(merchantId)
      if (list.includes(key)) { setStatus(`PageKey "${key}" sudah ada`); setTimeout(()=>setStatus(''),3000); return }
    } catch {}
    try {
      const existing = await universalMerchantRepository.getDraft(merchantId, key).catch(()=>null)
      if (existing && (existing as unknown as {layout?:unknown})?.layout) { setStatus(`PageKey "${key}" sudah ada`); setTimeout(()=>setStatus(''),3000); return }
    } catch {}
    // unsaved temp — hilang saat refresh jika belum save
    setPageKey(key)
    setData({ layout: { components: [] } } as unknown)
    setStatus(`Draft baru "${key}" — belum tersimpan (hilang saat refresh)`)
    setTimeout(()=>setStatus(''),3000)
  }

  const onSave = async ({ components }: { components: UniversalComponent[] }) => {
    let key = pageKey.trim()
    if (!key) {
      const input = prompt('pageKey baru:', 'my-page')
      if (!input) { setStatus('Save gagal: pageKey wajib diisi'); setTimeout(()=>setStatus(''),3000); return }
      key = input.trim()
      if (!key) { setStatus('Save gagal: pageKey wajib diisi'); setTimeout(()=>setStatus(''),3000); return }
    }
    if (!/^[a-z0-9_-]+$/i.test(key)) { setStatus('Save gagal: pageKey hanya huruf/angka/_/-'); setTimeout(()=>setStatus(''),3000); return }
    // uniq check hanya untuk new page (yang belum ada di list)
    const isNew = !pages.includes(key)
    if (isNew) {
      try {
        const { pages: list } = await universalMerchantRepository.listPages(merchantId)
        if (list.includes(key)) { setStatus(`Save gagal: pageKey "${key}" sudah ada`); setTimeout(()=>setStatus(''),3000); return }
      } catch {}
    }
    try {
      const res = await universalMerchantRepository.save(merchantId, key, components, isNew ? undefined : lockVersion) as { tree?: string; unchanged?: string[]; page?: { lockVersion?: number } }
      setPageKey(key)
      setData({ layout: { components } } as unknown)
      setLockVersion(res.page?.lockVersion)
      setStatus(`Saved ✔ ${res.tree ?? key}${res.unchanged?.length === 2 ? ' (tidak ada perubahan)' : ''}`)
      setTimeout(() => setStatus(''), 3000)
      loadPages(merchantId)
    } catch (e) {
      const err = e as Error & { status?: number }
      setStatus(err.status === 409 ? 'Save failed: draft diubah di tempat lain — pilih ulang page untuk memuat versi terbaru' : 'Save failed: ' + String(err.message))
      setTimeout(()=>setStatus(''),5000)
    }
  }

  const onPublish = async ({ components }: { components: UniversalComponent[] }) => {
    let key = pageKey.trim()
    if (!key) { setStatus('Publish gagal: pageKey wajib diisi — Save dulu'); setTimeout(()=>setStatus(''),3000); return }
    // publish harus sudah pernah save (uniq exists)
    try {
      const existing = await universalMerchantRepository.getDraft(merchantId, key).catch(()=>null)
      if (!existing) { setStatus(`Publish gagal: pageKey "${key}" belum ada — Save dulu`); setTimeout(()=>setStatus(''),3000); return }
    } catch {}
    try {
      const res = await universalMerchantRepository.publish(merchantId, key)
      setStatus(`Published ✔ ${res.releaseId}`)
      setTimeout(() => setStatus(''), 3000)
    } catch (e) { setStatus('Publish failed: ' + String((e as Error).message)); setTimeout(()=>setStatus(''),3000) }
    // sync data after publish
    try { const d = await universalMerchantRepository.getDraft(merchantId, key); setData(d); setLockVersion(d.lockVersion) } catch {}
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, background: '#1a1f35', alignItems: 'center', flexWrap:'wrap' }}>
        <input value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="merchantId" style={{ height: 28, borderRadius: 6, border: '1px solid #2c3354', background: '#0f1220', color: '#e6e9f5', padding: '0 8px', fontSize: 13 }} />
        <select value={pageKey} onChange={e => setPageKey(e.target.value)} style={{ height: 28, borderRadius: 6, border: '1px solid #2c3354', background: '#0f1220', color: '#e6e9f5', padding: '0 8px', fontSize: 13, minWidth: 180 }}>
          {pages.length ? pages.map(p=> <option key={p} value={p}>{p}</option>) : <option value="">(no pages)</option>}
          {pageKey && !pages.includes(pageKey) ? <option value={pageKey}>{pageKey} (draft)</option> : null}
        </select>
        <button onClick={handleNew} style={{ height: 28, padding:'0 12px', borderRadius:6, border:'1px solid #6c8cff', background:'#6c8cff', color:'#fff', cursor:'pointer', fontSize:13}}>New</button>
        <span style={{ fontSize: 11, color: '#9aa3c7' }}>default home • draft hilang saat refresh jika belum save</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: (status.includes('failed') || status.includes('gagal')) ? '#ff6b6b' : '#3ad29f' }}>{status}</span>
        <a href="/" style={{ fontSize: 12, color: '#6c8cff' }}>Home →</a>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <FajrinaBuilder data={data as never} registry={registry} pages={pages} merchantId={merchantId} pageKey={pageKey} onSave={onSave} onPublish={onPublish} onChange={setData as never} />
      </div>
    </div>
  )
}
