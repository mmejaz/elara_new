import { LineChartOutlined } from '@ant-design/icons'
import { Area } from '@ant-design/charts'
import { Card, Typography } from 'antd'
import { useMemo } from 'react'
import { hexToRgba } from '../../../utils/color'
import { salesTrendData } from '../data'
import { useAppSelector } from '../../../store/hooks'

const { Text } = Typography

// Smooth area chart of weekly sales — fill/stroke follow the brand color.
function SalesTrendCard() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const isDark = themeMode === 'dark'

  const config = useMemo(
    () => ({
      data: salesTrendData,
      autoFit: true,
      xField: 'date',
      yField: 'value',
      height: 260,
      shapeField: 'smooth',
      style: {
        fill: `linear-gradient(-90deg, ${hexToRgba(primaryColor, 0)} 0%, ${hexToRgba(primaryColor, 0.35)} 100%)`,
      },
      line: { style: { stroke: primaryColor, strokeWidth: 2 } },
      axis: { y: { labelFormatter: (value) => `$${Number(value) / 1000}k` } },
      tooltip: {
        items: [
          {
            field: 'value',
            name: 'Sales',
            valueFormatter: (value) => `$${Number(value).toLocaleString()}`,
          },
        ],
      },
      theme: isDark ? 'classicDark' : 'classic',
    }),
    [isDark, primaryColor],
  )

  return (
    <Card className="h-full w-full" styles={{ body: { padding: 22 } }}>
      <div className="mb-3 flex items-center gap-2.5">
        <LineChartOutlined style={{ color: primaryColor }} />
        <Text strong className="!text-base">
          Weekly Sales Trend
        </Text>
      </div>
      <Area {...config} />
    </Card>
  )
}

export default SalesTrendCard
