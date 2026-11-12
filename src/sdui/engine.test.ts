import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { MemoryCacheStore, ScreenSource, type RenderNode } from '@fajekrina/sdui'
import { createScreenRepository } from '../repositories/screenRepository'
import { createClient } from '../api/client'
import { createSduiEngine } from './engine'

// the seed screens universal-service serves
const SEEDS = resolve(__dirname, '../../../universal-service/src/main/resources/data/universal/screens/merchant_demo')
const seed = (key: string) => readFileSync(resolve(SEEDS, `${key}.json`), 'utf8')

function backend() {
  const calls: Array<{ url: string; method: string; body?: unknown }> = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined })
    if (url.endsWith('/client/manifest/merchant_demo')) return new Response(JSON.stringify({ sequence: 3, screens: { checkout: 'v1', home: 'v1', seatSelection: 'v1' } }))
    const screen = url.match(/\/client\/screen\/merchant_demo\/(\w+)$/)?.[1]
    if (screen) {
      try { return new Response(seed(screen)) } catch { return new Response('{"errorCode":"SDUI-018"}', { status: 404 }) }
    }
    if (url.endsWith('/client/action/submit')) return new Response(JSON.stringify({ success: true, message: 'Checkout submitted' }))
    return new Response('', { status: 500 })
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

const walk = (nodes: RenderNode[], out: RenderNode[] = []): RenderNode[] => {
  for (const n of nodes) { out.push(n); walk(n.children, out) }
  return out
}

describe('createSduiEngine against universal-service', () => {
  it('loads the seeded screens through the manifest and submits checkout through the allow-listed request', async () => {
    const { calls, fetchImpl } = backend()
    const navigate = vi.fn()
    const engine = createSduiEngine({
      merchantId: 'merchant_demo', navigate, fetchImpl, store: new MemoryCacheStore(),
      repository: createScreenRepository(createClient({ fetchImpl }), fetchImpl)
    })
    await engine.refreshManifest()
    for (const key of ['home', 'seatSelection', 'checkout']) {
      expect((await engine.load(ScreenSource.key(key))).kind, key).toBe('loaded')
    }

    const screen = engine.screen(ScreenSource.key('checkout'), { seed: { seatId: 'A1', eventId: 'event-jazz-01' } })
    await screen.load()
    const nodes = () => walk(screen.render().nodes)
    expect(nodes().some((n) => n.text === 'Kursi A1 • event-jazz-01')).toBe(true)

    const formId = nodes().find((n) => n.field)!.field!.formId
    screen.setFieldValue(formId, 'name', 'Ada Lovelace')
    screen.setFieldValue(formId, 'email', 'ada@example.com')
    screen.setFieldValue(formId, 'phone', '081234567890')
    screen.setFieldValue(formId, 'paymentMethod', 'va')
    const pay = nodes().find((n) => n.element === 'button' && walk([n]).some((c) => c.text === 'Bayar Sekarang'))!
    await screen.handle(pay.on!.click!)

    const submit = calls.find((c) => c.url.endsWith('/client/action/submit'))!
    expect(submit.method).toBe('POST')
    expect(submit.body).toMatchObject({ action: 'CHECKOUT', data: { seatId: 'A1', name: 'Ada Lovelace', paymentMethod: 'va' } })
    expect(navigate).toHaveBeenCalledWith('home', {})                 // toast → navigate home
  })

  it('an unknown screen fails closed (notFound), no crash', async () => {
    const { fetchImpl } = backend()
    const engine = createSduiEngine({
      merchantId: 'merchant_demo', navigate: () => {}, fetchImpl, store: new MemoryCacheStore(),
      repository: createScreenRepository(createClient({ fetchImpl }), fetchImpl)
    })
    const state = await engine.load(ScreenSource.key('nope'))
    expect(state.kind === 'failed' && state.error.kind).toBe('unknownScreen')
  })
})
