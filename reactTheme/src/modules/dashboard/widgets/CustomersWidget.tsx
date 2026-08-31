import { TeamOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import StatWidgetShell from './StatWidgetShell'

/** Customers KPI card. */
export default function CustomersWidget() {
  const { t } = useTranslation()
  return (
    <StatWidgetShell
      title={t('dashboard.customers')}
      value={642}
      icon={<TeamOutlined />}
      color="#22c55e"
    />
  )
}
