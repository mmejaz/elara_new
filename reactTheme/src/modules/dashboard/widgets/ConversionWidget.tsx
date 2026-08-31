import { PercentageOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import StatWidgetShell from './StatWidgetShell'

/** Conversion-rate KPI card. */
export default function ConversionWidget() {
  const { t } = useTranslation()
  return (
    <StatWidgetShell
      title={t('dashboard.conversion')}
      value={18.6}
      suffix="%"
      icon={<PercentageOutlined />}
      color="#a855f7"
    />
  )
}
