import { Skeleton } from 'antd'
import { Suspense } from 'react'
import CustomWidgetCard from '../components/CustomWidgetCard'
import { WIDGET_REGISTRY } from './registry'
import type { DashboardWidget } from '../../dashboard-settings/types'

/**
 * Renders a single dashboard widget in isolation, resolved through the registry.
 * Shared by the dashboard grid and the Dashboard Setting preview modal so both
 * show a widget exactly as it appears live. A key with no registered view falls
 * back to the generic custom-widget card.
 */
export default function WidgetPreview({ widget }: { widget: DashboardWidget }) {
  const def = WIDGET_REGISTRY[widget.key]
  return (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 2 }} />}>
      {def ? <def.component widget={widget} /> : <CustomWidgetCard widget={widget} />}
    </Suspense>
  )
}
