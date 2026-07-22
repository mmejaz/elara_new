import {
  DollarOutlined,
  PercentageOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Col, Row, Segmented, Space } from 'antd'
import { useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import ChannelShareCard from '../components/ChannelShareCard'
import MonthlyRevenuePanel from '../components/MonthlyRevenuePanel'
import RecentOrdersCard from '../components/RecentOrdersCard'
import { useAppSelector } from '../../../store/hooks'

function DashboardPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const [period, setPeriod] = useState('Week')

  const statCards = [
    {
      title: 'Revenue',
      value: 84320,
      prefix: '$',
      icon: <DollarOutlined />,
      color: primaryColor,
    },
    {
      title: 'Orders',
      value: 1284,
      icon: <ShoppingCartOutlined />,
      color: '#f59e0b',
    },
    {
      title: 'Customers',
      value: 642,
      icon: <TeamOutlined />,
      color: '#22c55e',
    },
    {
      title: 'Conversion',
      value: 18.6,
      suffix: '%',
      icon: <PercentageOutlined />,
      color: '#a855f7',
    },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Dashboard"
        subtitle="Track today's activity and keep the store moving."
        extra={
          <Segmented
            options={['Today', 'Week', 'Month']}
            value={period}
            onChange={setPeriod}
          />
        }
      />

      <Row gutter={[12, 12]}>
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Row>

      <MonthlyRevenuePanel />

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={14}>
          <RecentOrdersCard />
        </Col>
        <Col xs={24} xl={10}>
          <ChannelShareCard />
        </Col>
      </Row>
    </Space>
  )
}

export default DashboardPage
