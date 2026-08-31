import { OrderedListOutlined } from '@ant-design/icons'
import { Card, Col, DatePicker, Row, Space, Table, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { useTableSearch } from '../../../components/DataTable'
import ChannelShareCard from '../../dashboard/components/ChannelShareCard'

const { Text } = Typography

const attendanceRows = [
  { key: 1, group: 'Class A', total: 32, present: 28, excused: 2, unexcused: 2 },
  { key: 2, group: 'Class B', total: 30, present: 27, excused: 1, unexcused: 2 },
  { key: 3, group: 'Class C', total: 28, present: 25, excused: 3, unexcused: 0 },
  { key: 4, group: 'Class D', total: 34, present: 30, excused: 2, unexcused: 2 },
]

function AttendancePage() {
  const { t } = useTranslation()
  const columns = [
    { title: t('attendance.col.class'), dataIndex: 'group' },
    { title: t('attendance.col.total'), dataIndex: 'total' },
    { title: t('attendance.col.present'), dataIndex: 'present' },
    { title: t('attendance.col.excused'), dataIndex: 'excused' },
    { title: t('attendance.col.unexcused'), dataIndex: 'unexcused' },
  ]
  const { value: search, input: searchInput } = useTableSearch(t('attendance.searchPlaceholder'))
  const [month, setMonth] = useState<Dayjs>(dayjs())

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? attendanceRows.filter((r) => r.group.toLowerCase().includes(q)) : attendanceRows
  }, [search])

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={t('attendance.title')}
        subtitle={t('attendance.subtitle')}
        extra={
          <Space>
            <DatePicker
              picker="month"
              value={month}
              onChange={(m) => setMonth(m ?? dayjs())}
              allowClear={false}
              format="MMM YYYY"
            />
            {searchInput}
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={14}>
          <Card className="w-full" styles={{ body: { padding: 18 } }}>
            <div className="mb-4 flex items-center gap-2.5">
              <OrderedListOutlined />
              <Text strong>{t('attendance.register', { month: month.format('MMMM YYYY') })}</Text>
            </div>

            <Table
              columns={columns}
              dataSource={rows}
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
