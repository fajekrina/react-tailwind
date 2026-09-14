/**
 * Types — re-export Universal SDUI types from fajrina-sdui (agostic)
 */
export type {
  UniversalPageConfig,
  UniversalLayout,
  UniversalComponent,
  UniversalComponentType,
  UniversalBehavior,
  UniversalAction,
  FajrinaData,
  FajrinaActionEvent
} from '@fajekrina/sdui'

export interface RouteParams {
  merchantId?: string
  pageKey?: string
}

export const DEFAULT_MERCHANT = 'merchant_demo'
export const DEFAULT_PAGE = 'home'
