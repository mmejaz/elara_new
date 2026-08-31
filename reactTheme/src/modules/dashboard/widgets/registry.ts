import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { DashboardWidget } from '../../dashboard-settings/types'

/**
 * The dashboard widget registry.
 *
 * Each dashboard widget is a self-contained view file under `./` that renders a
 * single card. This registry maps a widget's `key` (the same key stored in the
 * `dashboard_widgets` table + seeded by DashboardWidgetSeeder) to its component
 * and its grid size. The dashboard page walks the widgets a user is allowed to
 * see and renders each one through this map — so it never imports widgets
 * directly and never needs editing when a widget is added.
 *
 * ── To add a new widget ──────────────────────────────────────────────────────
 *   1. Create the view file:  ./MyThingWidget.tsx  (default-export a component;
 *      it may accept an optional `{ widget }` prop for its DB metadata).
 *   2. Register it below:      my_thing: { component: lazy(() => import('./MyThingWidget')), span }
 *   3. Seed the DB row:        add it to DashboardWidgetSeeder (key: 'my_thing'),
 *      or create it from the Dashboard Settings screen. Role visibility is then
 *      controlled per-role via the role_dashboard_widgets pivot.
 *
 * A key present in the DB but missing here falls back to a generic card, and a
 * key present here but not in the DB simply never renders — the two stay
 * loosely coupled on purpose.
 */
export interface WidgetSpan {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

export interface WidgetDef {
  /** Lazily-loaded view. May ignore the `widget` prop or use it for its metadata. */
  component: LazyExoticComponent<ComponentType<{ widget?: DashboardWidget }>>
  /** AntD grid span for the wrapping <Col> the page provides. */
  span?: WidgetSpan
}

// Four-up KPI tiles on wide screens, two-up on tablets, stacked on phones.
const STAT_SPAN: WidgetSpan = { xs: 24, sm: 12, lg: 6 }

export const WIDGET_REGISTRY: Record<string, WidgetDef> = {
  revenue: { component: lazy(() => import('./RevenueWidget')), span: STAT_SPAN },
  orders: { component: lazy(() => import('./OrdersWidget')), span: STAT_SPAN },
  customers: { component: lazy(() => import('./CustomersWidget')), span: STAT_SPAN },
  conversion: { component: lazy(() => import('./ConversionWidget')), span: STAT_SPAN },
  monthly_revenue: { component: lazy(() => import('./MonthlyRevenueWidget')), span: { xs: 24 } },
  recent_orders: { component: lazy(() => import('./RecentOrdersWidget')), span: { xs: 24, xl: 14 } },
  traffic_by_channel: { component: lazy(() => import('./TrafficByChannelWidget')), span: { xs: 24, xl: 10 } },
  tenants: { component: lazy(() => import('./TenantsWidget')), span: { xs: 24, lg: 12 } },
  modules: { component: lazy(() => import('./ModulesWidget')), span: { xs: 24, lg: 12 } },
}

/** Fallback grid size for custom widgets that have no registry entry. */
export const DEFAULT_WIDGET_SPAN: WidgetSpan = { xs: 24, sm: 12, xl: 8 }

/** Keys that have a real view file (used as the "still loading" placeholder set). */
export const REGISTERED_WIDGET_KEYS = Object.keys(WIDGET_REGISTRY)
