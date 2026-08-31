import { Col, Row, Segmented, Space, theme } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import WaveAccent from '../../../components/WaveAccent'
import WidgetPreview from '../widgets/WidgetPreview'
import {
  DEFAULT_WIDGET_SPAN,
  REGISTERED_WIDGET_KEYS,
  WIDGET_REGISTRY,
} from '../widgets/registry'
import { useAppSelector } from '../../../store/hooks'
import { useMyDashboardWidgets } from '../../dashboard-settings/queries'
import type { DashboardWidget } from '../../dashboard-settings/types'

function DashboardPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { token } = theme.useToken()
  const { t } = useTranslation()
  const [period, setPeriod] = useState('Week')

  // Which widgets this user may see (union across their roles), already sorted by
  // sort_order server-side. Until the query resolves, fall back to the registered
  // built-ins so the dashboard never flashes empty.
  const { data: visible } = useMyDashboardWidgets()
  const widgets: DashboardWidget[] =
    visible ?? REGISTERED_WIDGET_KEYS.map((key) => ({ key, label: key }))

  return (
    <Space orientation="vertical" size={16} className="w-full">
      {/* Original header, unchanged — now with a subtle animated wave behind it.
          Radius follows the theme's card token so it matches every other card. */}
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: token.borderRadiusLG }}
      >
        <WaveAccent color={primaryColor} className="h-14" />
        <div className="relative z-10">
          <PageHeader
            title={t('dashboard.title')}
            subtitle={t('dashboard.subtitle')}
            extra={
              <Segmented
                options={[
                  { value: 'Today', label: t('dashboard.today') },
                  { value: 'Week', label: t('dashboard.week') },
                  { value: 'Month', label: t('dashboard.month') },
                ]}
                value={period}
                onChange={setPeriod}
              />
            }
          />
        </div>
      </div>

      {/* One flat grid. Each visible widget is looked up in the registry and
          rendered in its own <Col>; a widget with no registered view (e.g. one
          created from Dashboard Setting) falls back to a generic card. Order and
          size come from sort_order + the registry, so this page never changes
          when a widget is added. */}
      <Row gutter={[12, 12]}>
        {widgets.map((w) => {
          const span = WIDGET_REGISTRY[w.key]?.span ?? DEFAULT_WIDGET_SPAN
          return (
            <Col key={w.key} {...span}>
              <WidgetPreview widget={w} />
            </Col>
          )
        })}
      </Row>
    </Space>
  )
}

export default DashboardPage
