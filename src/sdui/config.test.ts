import { describe, expect, it } from 'vitest'
import { specScreenKey } from './config'

describe('specScreenKey', () => {
  it('maps 0.3.x kebab-case page keys to spec screen keys; leaves spec keys alone', () => {
    expect(specScreenKey('seat-selection')).toBe('seatSelection')
    expect(specScreenKey('order--detail-')).toBe('orderDetail')
    for (const key of ['home', 'seatSelection', 'promo_banner']) expect(specScreenKey(key)).toBe(key)
  })
})
