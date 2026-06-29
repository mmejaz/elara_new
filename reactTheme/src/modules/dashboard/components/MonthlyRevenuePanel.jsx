import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Column } from '@ant-design/charts'
import { Card, DatePicker, Divider, Segmented, Select, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { monthlyRevenueData } from '../data'

const { Text } = Typography

// Grouped-column revenue chart with a side summary. Filters are local state and
// operate on the static dataset — wire to a query/params when integrating.
function MonthlyRevenuePanel() {
  const primaryColor = useSelector((state) => state.ui.primaryColor)
  const themeMode = useSelector((state) => state.ui.themeMode)
  const [feeType, setFeeType] = useState('all')
  const [summaryMode, setSummaryMode] = useState('Monthly')
  const [summaryDate, setSummaryDate] = useState(dayjs('2025-06-01'))
  const isDark = themeMode === 'dark'
  const receivedColor = isDark ? '#4ade80' : '#22c55e'
  const pendingColor = primaryColor
  const mutedBorder = isDark ? '#303030' : '#e5e7eb'
  const panelBackground = isDark ? '#141414' : '#ffffff'

  const filteredData = useMemo(
    () =>
      feeType === 'all'
        ? monthlyRevenueData
        : monthlyRevenueData.filter((item) => item.type === feeType),
    [feeType],
  )

  const chartConfig = useMemo(
    () => ({
      data: filteredData,
      autoFit: true,
      xField: 'month',
      yField: 'value',
      colorField: 'type',
      group: true,
      height: 220,
      scale: { color: { range: [receivedColor, pendingColor] } },
      axis: { y: { labelFormatter: (value) => `$${Number(value) / 1000}k` } },
      tooltip: {
        items: [
          {
            field: 'value',
            valueFormatter: (value) => `$${Number(value).toLocaleString()}`,
          },
        ],
      },
      legend: {
        color: { position: 'bottom', layout: { justifyContent: 'center' } },
      },
      theme: isDark ? 'classicDark' : 'classic',
    }),
    [filteredData, isDark, pendingColor, receivedColor],
  )

  const summaryItems = [
    {
      label: 'Received',
      amount: '$543,245',
      trend: '57%',
      icon: <ArrowUpOutlined />,
      color: receivedColor,
    },
    {
      label: 'Pending',
      amount: '$248,110',
      trend: '7%',
      icon: <ArrowDownOutlined />,
      color: pendingColor,
    },
  ]

  return (
    <Card className="w-full overflow-hidden" styles={{ body: { padding: 0 } }}>
      <div
        className="grid w-full grid-cols-1 xl:grid-cols-[minmax(0,1fr)_356px]"
        style={{ background: panelBackground }}
      >
        <section className="overflow-hidden p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ArrowUpOutlined
                className="text-base"
                style={{ color: primaryColor }}
              />
              <Text strong>Monthly Revenue</Text>
            </div>
            <Space wrap>
              <Select
                value={feeType}
                onChange={setFeeType}
                style={{ minWidth: 160 }}
                suffixIcon={<DollarOutlined />}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'Received', label: 'Received' },
                  { value: 'Pending', label: 'Pending' },
                ]}
              />
            </Space>
          </div>
          <Column {...chartConfig} />
        </section>

        <aside
          className="border-t p-5 xl:border-l xl:border-t-0"
          style={{ borderColor: mutedBorder }}
        >
          <div className="mb-6 flex flex-nowrap items-center justify-between gap-2">
            <Segmented
              size="middle"
              options={['Monthly', 'Yearly']}
              value={summaryMode}
              onChange={setSummaryMode}
            />
            <DatePicker
              picker={summaryMode === 'Yearly' ? 'year' : 'month'}
              value={summaryDate}
              onChange={(value) => value && setSummaryDate(value)}
              format={summaryMode === 'Yearly' ? 'YYYY' : 'MMM YYYY'}
              allowClear={false}
              suffixIcon={<CalendarOutlined />}
              style={{ width: 140 }}
            />
          </div>

          <div className="space-y-6">
            {summaryItems.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center gap-4">
                  <div
                    className="grid size-11 place-items-center rounded-lg text-lg text-white"
                    style={{ background: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Text>{item.label}</Text>
                    <div className="mt-1 flex flex-wrap items-end gap-3">
                      <span className="text-2xl leading-none">{item.amount}</span>
                      <Text
                        style={{ color: item.color }}
                        className="!font-semibold"
                      >
                        {item.trend}
                      </Text>
                    </div>
                  </div>
                </div>
                {index === 0 && <Divider className="!my-6" />}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Card>
  )
}

export default MonthlyRevenuePanel
