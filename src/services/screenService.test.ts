import { describe, expect, it, vi } from 'vitest'
import { blankScreen, createScreenService } from './screenService'
import type { ScreenRepository } from '../repositories/screenRepository'

function fakeRepo() {
  let lock = 4
  const repo = {
    list: vi.fn(async () => ({ merchantId: 'm', screens: [{ key: 'home', status: 'PUBLISHED' }] })),
    draft: vi.fn(async () => ({ merchantId: 'm', key: 'home', status: 'PUBLISHED', lockVersion: lock, payload: blankScreen('home') })),
    save: vi.fn(async (_m: string, key: string, _p: unknown, lockVersion?: number) => {
      if (lockVersion !== undefined && lockVersion !== lock) throw Object.assign(new Error('stale'), { status: 409 })
      lock += 1
      return { message: 'Screen saved', key, lockVersion: lock, unchanged: false }
    }),
    publish: vi.fn(async (_m: string, key: string) => {
      lock += 1                                    // publish touches the screen row
      return { message: 'Screen published', key, sequence: 2, contentHash: 'h', unchanged: false, lockVersion: lock }
    })
  }
  return repo as unknown as ScreenRepository & typeof repo
}

describe('screenService (builder workflow)', () => {
  it('keeps the lock across open → save → publish → save', async () => {
    const repo = fakeRepo()
    const svc = createScreenService(repo)
    expect(await svc.list('m')).toEqual(['home'])
    await svc.open('m', 'home')
    await svc.save('m', blankScreen('home'))
    expect(repo.save).toHaveBeenLastCalledWith('m', 'home', expect.anything(), 4)
    await svc.publish('m', blankScreen('home'))
    expect(repo.save).toHaveBeenLastCalledWith('m', 'home', expect.anything(), 5)
    expect(repo.publish).toHaveBeenCalledWith('m', 'home')
    await svc.save('m', blankScreen('home'))           // the lock after publish is used: no 409
    expect(repo.save).toHaveBeenLastCalledWith('m', 'home', expect.anything(), 7)
  })

  it('a new screen saves without a lock; an invalid key is refused before any request', async () => {
    const repo = fakeRepo()
    const svc = createScreenService(repo)
    await svc.save('m', blankScreen('promoBanner'))
    expect(repo.save).toHaveBeenLastCalledWith('m', 'promoBanner', expect.anything(), undefined)
    await expect(svc.save('m', blankScreen('promo-banner'))).rejects.toThrow(/Screen key/)
    expect(repo.save).toHaveBeenCalledTimes(1)
  })
})
