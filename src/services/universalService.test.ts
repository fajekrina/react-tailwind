import { describe, expect, it, vi } from 'vitest'
import { memoryStorage } from '@fajekrina/sdui'
import { createUniversalService } from './universalService'
import type { UniversalRepository } from '../repositories/universalRepository'
import { resolveTarget } from '../utils/route'

const page = { pageKey: 'home', merchantId: 'merchant_demo', layout: { components: [{ id: 'h', type: 'Heading', props: { content: 'Halo' } }] } }

function fakeRepo(responses: Array<{ status: number; body?: unknown; etag?: string } | Error>) {
  const fetchPublishedPage = vi.fn(async () => {
    const r = responses.shift()!
    if (r instanceof Error) throw r
    return r
  })
  return { repo: { fetchPublishedPage, submitAction: vi.fn() } as unknown as UniversalRepository, fetchPublishedPage }
}

describe('universalService (library loader + app repository)', () => {
  it('revalidates with the stored ETag and reuses the cached release on 304', async () => {
    const { repo, fetchPublishedPage } = fakeRepo([{ status: 200, body: page, etag: 'h1' }, { status: 304 }])
    const svc = createUniversalService({ repository: repo, storage: memoryStorage() })
    expect((await svc.loadPublishedPage('merchant_demo', 'home')).source).toBe('fresh')
    const second = await svc.loadPublishedPage('merchant_demo', 'home')
    expect(fetchPublishedPage).toHaveBeenLastCalledWith('merchant_demo', 'home', expect.objectContaining({ etag: 'h1' }))
    expect(second.source).toBe('not-modified')
    expect(second.page).toEqual(page)
  })

  it('serves last-good when offline and an error page when nothing is cached', async () => {
    const storage = memoryStorage()
    const { repo } = fakeRepo([{ status: 200, body: page, etag: 'h1' }, new Error('offline')])
    const svc = createUniversalService({ repository: repo, storage })
    await svc.loadPublishedPage('merchant_demo', 'home')
    expect((await svc.loadPublishedPage('merchant_demo', 'home')).source).toBe('cache')

    const empty = createUniversalService({ repository: fakeRepo([new Error('offline')]).repo, storage: memoryStorage() })
    const r = await empty.loadPublishedPage('merchant_demo', 'home')
    expect(r.source).toBe('error')
    expect(r.page.pageKey).toBe('error')
  })
})

describe('resolveTarget', () => {
  it('redirects / to the default page and keeps explicit params', () => {
    expect(resolveTarget(undefined, undefined, '', '/').shouldRedirect).toBe('/merchant_demo/home')
    expect(resolveTarget('m', 'checkout', '', '/m/checkout')).toEqual({ mid: 'm', key: 'checkout', shouldRedirect: null })
  })
})
