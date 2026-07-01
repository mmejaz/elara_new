import {
  CalendarOutlined,
  OrderedListOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Space, Table, Typography } from 'antd'
import PageHeader from '../../../components/PageHeader'
import ChannelShareCard from '../../dashboard/components/ChannelShareCard'
import { useAppSelector } from '../../../store/hooks'

const { Text } = Typography

const attendanceRows = [
  { key: 1, group: 'Class A', total: 32, present: 28, excused: 2, unexcused: 2 },
  { key: 2, group: 'Class B', total: 30, present: 27, excused: 1, unexcused: 2 },
  { key: 3, group: 'Class C', total: 28, present: 25, excused: 3, unexcused: 0 },
  { key: 4, group: 'Class D', total: 34, present: 30, excused: 2, unexcused: 2 },
]

const columns = [
  { title: 'Class', dataIndex: 'group' },
  { title: 'Total', dataIndex: 'total' },
  { title: 'Present', dataIndex: 'present' },
  { title: 'Excused', dataIndex: 'excused' },
  { title: 'Un-excused', dataIndex: 'unexcused' },
]

function AttendancePage() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const borderRadius = useAppSelector((state) => state.ui.borderRadius)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Attendance"
        subtitle="Daily attendance overview across all classes."
      />

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={14}>
          <Card className="w-full" styles={{ body: { padding: 18 } }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <OrderedListOutlined />
                <Text strong>Attendance Register</Text>
              </div>
              <Button icon={<CalendarOutlined />}>26 Jun, 2025</Button>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_92px_92px]">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search classes..."
                style={{ borderRadius }}
              />
              <Button
                icon={<SearchOutlined />}
                type="primary"
                style={{ background: primaryColor, borderColor: primaryColor, borderRadius }}
              >
                Search
              </Button>
              <Button icon={<ReloadOutlined />} style={{ borderRadius }}>
                Reset
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={attendanceRows}
              pagination={false}
              size="small"
              scroll={{ x: true }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <ChannelShareCard />
        </Col>
      </Row>
    </Space>
  )
}

export default AttendancePage
