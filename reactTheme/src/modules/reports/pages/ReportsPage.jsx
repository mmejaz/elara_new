import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Space, Typography } from 'antd'
import { useSelector } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import { hexToRgba } from '../../../utils/color'

const { Text } = Typography

const reports = [
  { key: 'sales', name: 'Sales Summary', period: 'Monthly' },
  { key: 'users', name: 'User Activity', period: 'Weekly' },
  { key: 'finance', name: 'Finance Statement', period: 'Quarterly' },
]

function ReportsPage() {
  const primaryColor = useSelector((state) => state.ui.primaryColor)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Reports"
        subtitle="Generate and download workspace reports."
      />

      <Row gutter={[12, 12]}>
        {reports.map((report) => (
          <Col key={report.key} xs={24} md={8}>
            <Card styles={{ body: { padding: 18 } }}>
              <div className="flex items-center gap-3">
                <div
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
                  style={{
                    background: hexToRgba(primaryColor, 0.12),
                    color: primaryColor,
                  }}
                >
                  <FileTextOutlined />
                </div>
                <div className="min-w-0 flex-1">
                  <Text strong className="!block">
                    {report.name}
                  </Text>
                  <Text type="secondary" className="!text-xs">
                    {report.period}
                  </Text>
                </div>
                <Button type="text" icon={<DownloadOutlined />} aria-label="Download" />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Empty description="Select a report above to preview its data here." />
      </Card>
    </Space>
  )
}

export default ReportsPage
