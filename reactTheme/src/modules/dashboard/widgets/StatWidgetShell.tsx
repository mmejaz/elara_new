import { Card, Statistic } from 'antd'
import type { ReactNode } from 'react'
import { hexToRgba } from '../../../utils/color'

/**
 * Shared card body for the KPI stat widgets: a Statistic on the left, a tinted
 * icon tile on the right. The dashboard page provides the grid <Col>, so this
 * renders only the Card — keep new stat widgets thin by reusing it.
 */
export default function StatWidgetShell({
  title,
  value,
  prefix,
  suffix,
  icon,
  color,
}: {
  title: ReactNode
  value: string | number
  prefix?: ReactNode
  suffix?: ReactNode
  icon: ReactNode
  color: string
}) {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <div className="flex items-center justify-between gap-4">
        <Statistic title={title} value={value} prefix={prefix} suffix={suffix} styles={{ content: { color } }} />
        <div
          className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
          style={{ background: hexToRgba(color, 0.12), color }}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}
