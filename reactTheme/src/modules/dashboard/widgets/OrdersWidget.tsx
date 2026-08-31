import { ShoppingCartOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import StatWidgetShell from './StatWidgetShell'

/** Orders KPI card. */
export default function OrdersWidget() {
  const { t } = useTranslation()
  return (
    <StatWidgetShell
      title={t('dashboard.orders')}
      value={1284}
      icon={<ShoppingCartOutlined />}
      color="#f59e0b"
    />
  )
}
