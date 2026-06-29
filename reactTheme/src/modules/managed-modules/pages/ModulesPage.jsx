import {
  AppstoreOutlined,
  BankOutlined,
  BookOutlined,
  CalendarOutlined,
  MessageOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Space, Switch, Typography } from 'antd'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import { hexToRgba } from '../../../utils/color'

const { Text } = Typography

const initialModules = [
  { key: 'students', name: 'Students', description: 'Enrollment & records', icon: <TeamOutlined />, enabled: true },
  { key: 'courses', name: 'Courses', description: 'Catalog & curriculum', icon: <BookOutlined />, enabled: true },
  { key: 'finance', name: 'Finance', description: 'Invoices & payments', icon: <BankOutlined />, enabled: true },
  { key: 'calendar', name: 'Calendar', description: 'Events & scheduling', icon: <CalendarOutlined />, enabled: false },
  { key: 'messaging', name: 'Messaging', description: 'In-app notifications', icon: <MessageOutlined />, enabled: false },
  { key: 'apps', name: 'Integrations', description: 'Third-party apps', icon: <AppstoreOutlined />, enabled: true },
]

function ModulesPage() {
  const primaryColor = useSelector((state) => state.ui.primaryColor)
  const [modules, setModules] = useState(initialModules)

  const toggle = (key) =>
    setModules((current) =>
      current.map((module) =>
        module.key === key ? { ...module, enabled: !module.enabled } : module,
      ),
    )

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Managed Modules"
        subtitle="Enable or disable features for this workspace."
      />
      <Row gutter={[12, 12]}>
        {modules.map((module) => (
          <Col key={module.key} xs={24} sm={12} lg={8}>
            <Card styles={{ body: { padding: 18 } }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
                    style={{
                      background: hexToRgba(primaryColor, 0.12),
                      color: primaryColor,
                    }}
                  >
                    {module.icon}
                  </div>
                  <div>
                    <Text strong className="!block">
                      {module.name}
                    </Text>
                    <Text type="secondary" className="!text-xs">
                      {module.description}
                    </Text>
                  </div>
                </div>
                <Switch
                  checked={module.enabled}
                  onChange={() => toggle(module.key)}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  )
}

export default ModulesPage
