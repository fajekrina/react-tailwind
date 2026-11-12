/**
 * The SDUI engine of this app: screens and the version manifest come from universal-service,
 * actions go through this bundle's allow-lists (ENDPOINTS, LINKS), navigation through the router.
 */
import { ActionDispatcher, PayloadSecurity, ScreenFactory, SduiCache, createEngine, type CacheStore, type SduiEngine, type SduiEvent, type SduiProps } from '@fajekrina/sdui'
import { MESSAGES_ID } from '@fajekrina/sdui/i18n'
import { browserNavigator, fetchNetworkClient, indexedDbStore, windowViewport } from '@fajekrina/sdui/browser'
import { screenRepository, type ScreenRepository } from '../repositories/screenRepository'
import { API_BASE, ENDPOINTS, LINKS, assetURL } from './config'

export interface EngineOptions {
  merchantId: string
  /** the app router: open screen `key` with navigation params */
  navigate: (key: string, params: SduiProps) => void
  repository?: ScreenRepository
  fetchImpl?: typeof fetch
  /** persistent cache tier (default IndexedDB; tests pass a memory store) */
  store?: CacheStore
  onEvent?: (event: SduiEvent) => void
}

export function createSduiEngine(options: EngineOptions): SduiEngine {
  const repo = options.repository ?? screenRepository
  return createEngine({
    screenFactory: new ScreenFactory().registerFallback((key, { signal }) => repo.screenBytes(options.merchantId, key, signal)),
    manifestLoader: () => repo.manifestBytes(options.merchantId),
    actionDispatcher: new ActionDispatcher({
      network: fetchNetworkClient({ baseUrl: API_BASE, endpoints: ENDPOINTS, fetchImpl: options.fetchImpl }),
      navigator: browserNavigator({ navigate: (screen, params) => options.navigate(screen, params), links: LINKS })
    }),
    // demo backend: signing is off by default (sdui.signing.enabled=false). With signing on,
    // use PayloadSecurity.signed(await webCryptoEd25519(publicKey)) and ?signed=true.
    security: PayloadSecurity.insecureDevelopment,
    cache: new SduiCache({ store: options.store ?? indexedDbStore() }),
    assetURL,
    messages: MESSAGES_ID,
    viewport: typeof window === 'undefined' ? undefined : windowViewport(),
    onEvent: options.onEvent,
    debug: import.meta.env.DEV
  })
}
