/**
 * Service — builder workflow on spec screens (business logic):
 * load a draft, save with the optimistic lock, publish (saving first), start a new screen.
 */
import { screenRepository, type ScreenRepository } from '../repositories/screenRepository'

/** spec identifier: letters, digits, `_`, starting with a letter */
export const SCREEN_KEY = /^[A-Za-z][A-Za-z0-9_]*$/

/** A minimal valid screen to start from. */
export function blankScreen(key: string) {
  return { schemaVersion: '1.1', screen: { key, root: { type: 'vstack', props: { spacing: 12, padding: 16, alignment: 'leading' } } } }
}

function keyOf(payload: unknown): string {
  const key = (payload as { screen?: { key?: unknown } })?.screen?.key
  if (typeof key !== 'string' || !SCREEN_KEY.test(key)) throw new Error('Screen key: huruf/angka/_ dan diawali huruf (mis. promoBanner)')
  return key
}

export function createScreenService(repo: ScreenRepository = screenRepository) {
  /** lock version per screen key, as last seen by this editor */
  const locks = new Map<string, number>()

  return {
    async list(merchantId: string): Promise<string[]> {
      return (await repo.list(merchantId)).screens.map((s) => s.key)
    },
    /** The draft payload of `key` (remembers its lock). */
    async open(merchantId: string, key: string): Promise<unknown> {
      const draft = await repo.draft(merchantId, key)
      locks.set(key, draft.lockVersion)
      return draft.payload
    },
    /** Save the editor payload under its own `screen.key`; a stale lock rejects (409). */
    async save(merchantId: string, payload: unknown) {
      const key = keyOf(payload)
      const result = await repo.save(merchantId, key, payload, locks.get(key))
      locks.set(key, result.lockVersion)
      return result
    },
    /** Save, then publish the saved draft as a new release. */
    async publish(merchantId: string, payload: unknown) {
      const saved = await this.save(merchantId, payload)
      const result = await repo.publish(merchantId, saved.key)
      locks.set(saved.key, result.lockVersion)
      return result
    },
    forget(key: string) {
      locks.delete(key)
    }
  }
}

export type ScreenService = ReturnType<typeof createScreenService>
