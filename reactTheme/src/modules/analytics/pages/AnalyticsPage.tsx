import {
  EyeOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FallOutlined,
} from '@ant-design/icons'
import { Col, Row, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import ChannelShareCard from '../../dashboard/components/ChannelShareCard'
import SalesTrendCard from '../../dashboard/components/SalesTrendCard'
import { useAppSelector } from '../../../store/hooks'

function AnalyticsPage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { t } = useTranslation()

  const statCards = [
    {
      title: t('analytics.pageViews'),
      value: 128400,
      icon: <EyeOutlined />,
      color: primaryColor,
    },
    {
      title: t('analytics.bounceRate'),
      value: 32.4,
      suffix: '%',
      icon: <FallOutlined />,
      color: '#ef4444',
    },
    {
      title: t('analytics.avgSession'),
      value: '4m 12s',
      icon: <ClockCircleOutlined />,
      color: '#0ea5e9',
    },
    {
      title: t('analytics.growth'),
      value: 12.8,
      suffix: '%',
      icon: <RiseOutlined />,
      color: '#22c55e',
    },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.subtitle')}
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
