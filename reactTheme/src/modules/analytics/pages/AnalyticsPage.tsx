import {
  EyeOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { Col, Row, Space } from 'antd'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import ChannelShareCard from '../../dashboard/components/ChannelShareCard'
import SalesTrendCard from '../../dashboard/components/SalesTrendCard'
import { useAppSelector } from '../../../store/hooks'

function AnalyticsPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)

  const statCards = [
    {
      title: 'Page Views',
      value: 128400,
      icon: <EyeOutlined />,
      color: primaryColor,
    },
    {
      title: 'Bounce Rate',
      value: 32.4,
      suffix: '%',
      icon: <FallOutlined />,
      color: '#ef4444',
    },
    {
      title: 'Avg. Session',
      value: '4m 12s',
      icon: <ClockCircleOutlined />,
      color: '#0ea5e9',
    },
    {
      title: 'Growth',
      value: 12.8,
      suffix: '%',
      icon: <RiseOutlined />,
      color: '#22c55e',
    },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Analytics"
        subtitle="Understand where your traffic comes from and how it converts."
      />

      <Row gutter={[12, 12]}>
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={14}>
          <SalesTrendCard />
        </Col>
        <Col xs={24} xl={10}>
          <ChannelShareCard />
        </Col>
      </Row>
    </Space>
  )
}

export default AnalyticsPage
