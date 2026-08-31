import { AppstoreOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Avatar, Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ICONS } from '../../../config/iconRegistry'
import { useAppSelector } from '../../../store/hooks'
import { useModules } from '../../../hooks/useModules'
import type { Module } from '../../../types/models'

const { Text } = Typography

const VISIBLE = '#22c55e'
const HIDDEN = '#94a3b8'

/** Small dot + label pill used for the module status. */
function StatusPill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium capitalize"
      style={{ background: `${color}1f`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  )
}

/**
 * Dashboard widget listing the app's modules (the ones the Module Builder
 * manages) in a compact table, each with its active/hidden status. Rendered
 * through the widget registry like every other widget.
 */
export default function ModulesWidget() {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { data, isLoading } = useModules()

  // Only real menu items count as "modules" (section headers are grouping only).
  const items = (data ?? []).filter((m) => m.type === 'item')
  const total = items.length
  const shown = items.slice(0, 5)

  const columns = useMemo<ColumnsType<Module>>(
    () => [
      {
        title: t('dashboard.col.module', { defaultValue: 'Module' }),
        dataIndex: 'name',
        render: (name: string, module: Module) => {
          const Icon = (module.icon ? ICONS[module.icon as keyof typeof ICONS] : undefined) ?? AppstoreOutlined
          return (
            <div className="flex items-center gap-2.5">
              <Avatar
                shape="square"
                size={28}
                style={{ background: `${primaryColor}1f`, color: primaryColor, fontSize: 13 }}
                icon={<Icon />}
              />
              <Text className="!truncate !text-[13px] !font-medium">{name}</Text>
            </div>
          )
        },
      },
      {
        title: t('common.status', { defaultValue: 'Status' }),
        dataIndex: 'is_visible',
        align: 'right',
        render: (visible: boolean) =>
          visible ? (
            <StatusPill color={VISIBLE}>{t('common.active', { defaultValue: 'active' })}</StatusPill>
          ) : (
            <StatusPill color={HIDDEN}>{t('dashboard.hidden', { defaultValue: 'hidden' })}</StatusPill>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, primaryColor],
  )

  return (
    <Card
      size="small"
      className="h-full"
      styles={{ body: { padding: 14 } }}
      title={
        <span className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md text-[13px]"
            style={{ background: `${primaryColor}1f`, color: primaryColor }}
          >
            <AppstoreOutlined />
          </span>
          <span className="font-semibold">{t('dashboard.modules', { defaultValue: 'Modules' })}</span>
        </span>
      }
      extra={
        <Link to="/modules" className="inline-flex items-center gap-1 text-[12px]">
          {t('common.viewAll', { defaultValue: 'View all' })} <ArrowRightOutlined className="text-[10px]" />
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : total === 0 ? (
        <Empty className="py-6" description={t('dashboard.noModules', { defaultValue: 'No modules yet' })} />
      ) : (
        <div className="flex flex-col gap-3">
          <Table<Module>
            rowKey="id"
            columns={columns}
            dataSource={shown}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />
          {total > shown.length && (
            <Link
              to="/modules"
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors hover:opacity-90"
              style={{ color: primaryColor, background: `${primaryColor}12` }}
            >
              {t('dashboard.viewAllModules', { count: total, defaultValue: 'View all {{count}} modules' })}
              <ArrowRightOutlined className="text-[10px]" />
            </Link>
          )}
        </div>
      )}
    </Card>
  )
}
