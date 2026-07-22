import { PieChartOutlined } from '@ant-design/icons'
import { Pie } from '@ant-design/charts'
import { Card, Typography } from 'antd'
import { useMemo } from 'react'
import { buildThemeColorPalette } from '../../../utils/color'
import { channelShareData } from '../data'
import { useAppSelector } from '../../../store/hooks'

const { Text } = Typography

// Donut chart of traffic/channel share, colored from a palette derived from the
// active brand color so it re-themes automatically.
function ChannelShareCard() {
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const themeMode = useAppSelector((state) => state.ui.themeMode)
  const isDark = themeMode === 'dark'

  const colors = useMemo(
    () => buildThemeColorPalette(primaryColor, channelShareData.length),
    [primaryColor],
  )

  const config = useMemo(
    () => ({
      data: channelShareData,
      autoFit: true,
      angleField: 'value',
      colorField: 'type',
      height: 260,
      innerRadius: 0.58,
      scale: { color: { range: colors } },
      label: {
        text: (datum) => `${datum.value}%`,
        position: 'outside',
        fontSize: 14,
        fontWeight: 700,
      },
      legend: {
        color: { position: 'bottom', layout: { justifyContent: 'center' } },
      },
      tooltip: {
        items: [
          {
            field: 'value',
            name: 'Share',
            valueFormatter: (value) => `${value}%`,
          },
        ],
      },
      theme: isDark ? 'classicDark' : 'classic',
    }),
    [colors, isDark],
  )

  return (
    <Card className="h-full w-full" styles={{ body: { padding: 22 } }}>
      <div className="mb-3 flex items-center gap-2.5">
        <PieChartOutlined style={{ color: primaryColor }} />
        <Text strong className="!text-base">
          Traffic by Channel
        </Text>
      </div>
      <Pie {...config} />
    </Card>
  )
}

export default ChannelShareCard
