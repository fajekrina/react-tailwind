/**
 * SDUI allow-lists of this app. Payloads only NAME things — requests, links, images —
 * and this bundle maps the names to endpoints and URLs. A name that is not here fails
 * closed in the engine.
 */
import type { Endpoint } from '@fajekrina/sdui/browser'

/** universal-service, proxied by Vite (`/api` → http://localhost:8080) */
export const API_BASE = '/api/universal/v1'

export const DEFAULT_MERCHANT = 'merchant_demo'
export const DEFAULT_SCREEN = 'home'

/** `api.request` names → endpoints under API_BASE */
export const ENDPOINTS: Record<string, Endpoint> = {
  submitCheckout: { method: 'POST', path: '/client/action/submit' }
}

/** `openURL.link` names → https URLs */
export const LINKS: Record<string, string> = {
  privacyPolicy: 'https://example.com/privacy',
  terms: 'https://example.com/terms',
  contactSupport: 'https://example.com/contact'
}

/** `image.name` → URL */
export const ASSETS: Record<string, string> = {
  'event-jazz-01': 'https://picsum.photos/seed/event-jazz-01/600/400',
  'event-rock-02': 'https://picsum.photos/seed/event-rock-02/600/400',
  'event-orchestra-03': 'https://picsum.photos/seed/event-orchestra-03/600/400'
}

/** Unknown names resolve to nothing (the engine never loads an arbitrary host). */
export function assetURL(name: string): string {
  return ASSETS[name] ?? ''
}
