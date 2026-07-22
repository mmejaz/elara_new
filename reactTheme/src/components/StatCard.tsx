import { Card, Col, Statistic } from 'antd'
import type { ReactNode } from 'react'
import { hexToRgba } from '../utils/color'

interface StatCardProps {
  title: ReactNode
  value: string | number
  prefix?: ReactNode
  suffix?: ReactNode
  icon: ReactNode
  color: string
}

/**
 * A single KPI card: AntD Statistic on the left, a tinted icon tile on the right.
 * Designed to sit inside an AntD <Row> via the wrapping <Col>.
 */
function StatCard({ title, value, prefix, suffix, icon, color }: StatCardProps) {
  return (
    <Col xs={24} sm={12} lg={6}>
      <Card styles={{ body: { padding: 16 } }}>
        <div className="flex items-center justify-between gap-4">
          <Statistic
            title={title}
            value={value}
            prefix={prefix}
            suffix={suffix}
            styles={{ content: { color } }}
          />
          <div
            className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
            style={{ background: hexToRgba(color, 0.12), color }}
          >
            {icon}
          </div>
        </div>
      </Card>
    </Col>
  )
}

export default StatCard
