/**
 * Route utils — resolve merchant/page from path params + query fallback (keep)
 * Mirrors universal-renderer.html ?merchant=&page= legacy
 */
import { DEFAULT_MERCHANT, DEFAULT_PAGE } from '../types/universal'

export function resolveTarget(
  paramMid: string | undefined,
  paramKey: string | undefined,
  search: string,
  pathname: string
): { mid: string; key: string; shouldRedirect: string | null } {
  const qs = new URLSearchParams(search)
  const qMid = qs.get('merchant')
  const qKey = qs.get('page')
  const mid = paramMid ?? qMid ?? DEFAULT_MERCHANT
  const key = paramKey ?? qKey ?? DEFAULT_PAGE

  if (!paramMid && !paramKey && !qMid && !qKey && pathname === '/') {
    return { mid, key, shouldRedirect: `/${mid}/${key}` }
  }
  if (paramMid && !paramKey && !qKey && pathname === `/${paramMid}`) {
    return { mid, key, shouldRedirect: `/${mid}/${key}` }
  }
  return { mid, key, shouldRedirect: null }
}
