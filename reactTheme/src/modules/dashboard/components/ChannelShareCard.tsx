import { PieChartOutlined } from '@ant-design/icons'
import { Pie } from '@ant-design/charts'
import { Card, Typography } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const colors = useMemo(
    () => buildThemeColorPalette(primaryColor, channelShareData.length),
    [primaryColor],
  )

  // Localize the channel names for the legend/labels without touching the source data.
  const localizedData = useMemo(
    () => channelShareData.map((d) => ({ ...d, type: t(`dashboard.channel.${d.type}`) })),
    [t],
  )

  const config = useMemo(
    () => ({
      data: localizedData,
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
            name: t('dashboard.share'),
            valueFormatter: (value) => `${value}%`,
          },
        ],
      },
      theme: isDark ? 'classicDark' : 'classic',
    }),
    [colors, isDark, localizedData, t],
  )

  return (
    <Card className="h-full w-full" styles={{ body: { padding: 22 } }}>
      <div className="mb-3 flex items-center gap-2.5">
        <PieChartOutlined style={{ color: primaryColor }} />
        <Text strong className="!text-base">
          {t('dashboard.trafficByChannel')}
        </Text>
      </div>
      <Pie {...config} />
    </Card>
  )
}

export default ChannelShareCard
