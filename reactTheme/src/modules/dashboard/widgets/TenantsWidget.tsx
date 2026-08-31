import { ArrowRightOutlined, ClusterOutlined } from '@ant-design/icons'
import { Avatar, Card, Empty, Skeleton, Table, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../../store/hooks'
import { isCentralHost } from '../../../utils/tenant'
import { useTenants } from '../../tenants/queries'
import type { Tenant } from '../../tenants/types'

const { Text } = Typography

const ACTIVE = '#22c55e'
const SUSPENDED = '#f59e0b'

/** Small dot + label pill used for the status breakdown and the table status. */
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
 * Dashboard widget listing the workspace's tenants: a hero total with an
 * active/suspended breakdown, then the most recent few in a compact table.
 * Tenants only exist in the central workspace, so on a tenant host the
 * (central-only) API is skipped and a short note is shown instead. Rendered
 * through the widget registry like every other widget.
 */
export default function TenantsWidget() {
  const { t } = useTranslation()
  const { token } = theme.useToken()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const central = isCentralHost()

  const { data, isLoading } = useTenants(
    { page: 1, per_page: 50 },
    { enabled: central },
  )
  const tenants = data?.data ?? []
  const total = data?.meta.total ?? 0
  const shown = tenants.slice(0, 5)

  const statusLabel = (s: Tenant['status']) => t(`tenants.status.${s}`, { defaultValue: s })

  const columns = useMemo<ColumnsType<Tenant>>(
    () => [
      {
        title: t('dashboard.col.tenant', { defaultValue: 'Tenant' }),
        dataIndex: 'name',
        render: (name: string) => (
          <div className="flex items-center gap-2.5">
            <Avatar
              shape="square"
              size={28}
              style={{ background: `${primaryColor}1f`, color: primaryColor, fontWeight: 600, fontSize: 12 }}
            >
              {(name?.charAt(0) ?? 'T').toUpperCase()}
            </Avatar>
            <Text className="!truncate !text-[13px] !font-medium">{name}</Text>
          </div>
        ),
      },
      {
        title: t('dashboard.col.domain', { defaultValue: 'Domain' }),
        dataIndex: 'domains',
        responsive: ['md'],
        render: (domains: string[]) => (
          <Text type="secondary" className="!text-[12px]">
            {domains?.[0] ?? '—'}
          </Text>
        ),
      },
      {
        title: t('common.status', { defaultValue: 'Status' }),
        dataIndex: 'status',
        align: 'right',
        render: (status: Tenant['status']) => (
          <StatusPill color={status === 'active' ? ACTIVE : SUSPENDED}>{statusLabel(status)}</StatusPill>
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
            <ClusterOutlined />
          </span>
          <span className="font-semibold">{t('dashboard.tenants', { defaultValue: 'Tenants' })}</span>
        </span>
      }
      extra={
        central && (
          <Link to="/tenants" className="inline-flex items-center gap-1 text-[12px]">
            {t('common.viewAll', { defaultValue: 'View all' })} <ArrowRightOutlined className="text-[10px]" />
          </Link>
        )
      }
    >
      {!central ? (
        <div className="py-6 text-center">
          <ClusterOutlined className="text-[28px]" style={{ color: token.colorTextQuaternary }} />
          <Text type="secondary" className="!mt-2 !block !text-[13px]">
            {t('dashboard.tenantsCentralOnly', { defaultValue: 'Tenants are managed in the central workspace.' })}
          </Text>
        </div>
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : total === 0 ? (
        <Empty className="py-6" description={t('dashboard.noTenants', { defaultValue: 'No tenants yet' })} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Recent tenants, in a compact table. */}
          <Table<Tenant>
            rowKey="id"
            columns={columns}
            dataSource={shown}
            pagination={false}
            size="small"
            scroll={{ x: true }}
          />

          {/* When there are more tenants than we list, a clear "see the rest"
              footer keeps the card compact yet scales to any count. */}
          {total > shown.length && (
            <Link
              to="/tenants"
              className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-colors hover:opacity-90"
              style={{ color: primaryColor, background: `${primaryColor}12` }}
            >
              {t('dashboard.viewAllTenants', {
                count: total,
                defaultValue: 'View all {{count}} tenants',
              })}
              <ArrowRightOutlined className="text-[10px]" />
            </Link>
          )}
        </div>
      )}
    </Card>
  )
}
