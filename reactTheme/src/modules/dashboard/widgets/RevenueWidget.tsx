import { DollarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../../store/hooks'
import StatWidgetShell from './StatWidgetShell'

/**
 * Revenue KPI card. Self-contained: owns its own copy/colour and (for now) a
 * placeholder value — swap in a real data hook here when the endpoint exists.
 */
export default function RevenueWidget() {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  return (
    <StatWidgetShell
      title={t('dashboard.revenue')}
      value={84320}
      prefix="$"
      icon={<DollarOutlined />}
      color={primaryColor}
    />
  )
}
