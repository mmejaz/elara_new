import {
  DollarOutlined,
  PercentageOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Col, Row, Segmented, Space, theme } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import WaveAccent from '../../../components/WaveAccent'
import ChannelShareCard from '../components/ChannelShareCard'
import MonthlyRevenuePanel from '../components/MonthlyRevenuePanel'
import RecentOrdersCard from '../components/RecentOrdersCard'
import CustomWidgetCard from '../components/CustomWidgetCard'
import { useAppSelector } from '../../../store/hooks'
import { useMyDashboardWidgets } from '../../dashboard-settings/queries'
import { isBuiltinWidget } from '../../dashboard-settings/icons'

function DashboardPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { token } = theme.useToken()
  const { t } = useTranslation()
  const [period, setPeriod] = useState('Week')

  // Which widgets this user may see (union across their roles). Until it loads,
  // show everything so the dashboard never flashes empty.
  const { data: visible } = useMyDashboardWidgets()
  const show = (key: string) => !visible || visible.some((w) => w.key === key)
  // Custom (non-built-in) widgets render a generic placeholder card.
  const customWidgets = (visible ?? []).filter((w) => !isBuiltinWidget(w.key))

  const statCards = [
    {
      key: 'revenue',
      title: t('dashboard.revenue'),
      value: 84320,
      prefix: '$',
      icon: <DollarOutlined />,
      color: primaryColor,
    },
    {
      key: 'orders',
      title: t('dashboard.orders'),
      value: 1284,
      icon: <ShoppingCartOutlined />,
      color: '#f59e0b',
    },
    {
      key: 'customers',
      title: t('dashboard.customers'),
      value: 642,
      icon: <TeamOutlined />,
      color: '#22c55e',
    },
    {
      key: 'conversion',
      title: t('dashboard.conversion'),
      value: 18.6,
      suffix: '%',
      icon: <PercentageOutlined />,
      color: '#a855f7',
    },
  ]

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

      <Row gutter={[12, 12]}>
        {statCards
          .filter((stat) => show(stat.key))
          .map(({ key, ...stat }) => (
            <StatCard key={key} {...stat} />
          ))}
      </Row>

      {show('monthly_revenue') && <MonthlyRevenuePanel />}

      {(show('recent_orders') || show('traffic_by_channel')) && (
        <Row gutter={[12, 12]}>
          {show('recent_orders') && (
            <Col xs={24} xl={show('traffic_by_channel') ? 14 : 24}>
              <RecentOrdersCard />
            </Col>
          )}
          {show('traffic_by_channel') && (
            <Col xs={24} xl={show('recent_orders') ? 10 : 24}>
              <ChannelShareCard />
            </Col>
          )}
        </Row>
      )}

      {customWidgets.length > 0 && (
        <Row gutter={[12, 12]}>
          {customWidgets.map((w) => (
            <Col key={w.key} xs={24} sm={12} xl={8}>
              <CustomWidgetCard widget={w} />
            </Col>
          ))}
        </Row>
      )}
    </Space>
  )
}

export default DashboardPage
