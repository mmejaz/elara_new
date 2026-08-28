import { Card, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../../store/hooks'
import { widgetIcon } from '../../dashboard-settings/icons'
import type { DashboardWidget } from '../../dashboard-settings/types'

const { Text } = Typography

/**
 * Generic placeholder for a custom widget added via Dashboard Setting that has
 * no dedicated component yet. Keeps the dashboard coherent so a newly created
 * widget is visibly present the moment a role is granted it.
 */
function CustomWidgetCard({ widget }: { widget: DashboardWidget }) {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)

  return (
    <Card size="small" className="h-full">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px]"
          style={{ background: `${primaryColor}14`, color: primaryColor }}
        >
          {widgetIcon(widget)}
        </span>
        <div className="min-w-0">
          <Text strong className="!block truncate">{widget.label}</Text>
          <Text type="secondary" className="!text-[12px]">
            {t('dashboard.customWidgetPlaceholder', { defaultValue: 'Widget coming soon' })}
          </Text>
        </div>
      </div>
    </Card>
  )
}

export default CustomWidgetCard
