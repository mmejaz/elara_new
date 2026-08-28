import { AppstoreOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Popconfirm, Row, Space, Spin, Switch, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import { useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import AddWidgetDrawer from '../components/AddWidgetDrawer'
import { isBuiltinWidget, widgetIcon } from '../icons'
import { useDashboardMatrix, useDeleteWidget, useSaveDashboardMatrix, useUpdateWidget } from '../queries'
import type { DashboardWidget } from '../types'

const { Text } = Typography

// Built-in widget key → i18n key (custom widgets fall back to their stored label).
const WIDGET_I18N: Record<string, string> = {
  revenue: 'dashboard.revenue',
  orders: 'dashboard.orders',
  customers: 'dashboard.customers',
  conversion: 'dashboard.conversion',
  monthly_revenue: 'dashboard.monthlyRevenue',
  recent_orders: 'dashboard.recentOrders',
  traffic_by_channel: 'dashboard.trafficByChannel',
}

type Draft = Record<number, Record<string, boolean>>

function DashboardSettingsPage() {
  const { t } = useTranslation()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const roles = useAppSelector((state) => state.auth.roles)
  const isSuperAdmin = roles.includes('Super Admin')

  const { data, isLoading } = useDashboardMatrix()
  const save = useSaveDashboardMatrix()
  const remove = useDeleteWidget()
  const update = useUpdateWidget()

  const [draft, setDraft] = useState<Draft>({})
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    if (!data) return
    const next: Draft = {}
    data.roles.forEach((r) => {
      next[r.id] = { ...r.config }
    })
    setDraft(next)
    // Keep the selection valid as widgets are added/removed.
    setActiveKey((prev) =>
      prev && data.widgets.some((w) => w.key === prev) ? prev : data.widgets[0]?.key ?? null,
    )
  }, [data])

  const dirty = useMemo(() => {
    if (!data) return false
    return data.roles.some((r) => data.widgets.some((w) => (draft[r.id]?.[w.key] ?? true) !== r.config[w.key]))
  }, [data, draft])

  const label = (w: DashboardWidget) => t(WIDGET_I18N[w.key] ?? '', { defaultValue: w.label })
  const enabledCount = (key: string) =>
    data ? data.roles.filter((r) => draft[r.id]?.[key] ?? true).length : 0

  if (!isSuperAdmin) {
    return (
      <Card>
        <Empty description={t('dashboardSettings.forbidden', { defaultValue: 'Only a Super Admin can configure dashboards.' })} />
      </Card>
    )
  }

  const setRoleWidget = (roleId: number, key: string, value: boolean) =>
    setDraft((prev) => ({ ...prev, [roleId]: { ...prev[roleId], [key]: value } }))

  const setAllRoles = (key: string, value: boolean) =>
    setDraft((prev) => {
      const next = { ...prev }
      data?.roles.forEach((r) => {
        next[r.id] = { ...next[r.id], [key]: value }
      })
      return next
    })

  const handleSave = () => {
    if (!data) return
    const payload = data.roles.map((r) => ({ id: r.id, config: draft[r.id] ?? {} }))
    save.mutate(payload, {
      onSuccess: () => toast.success(t('dashboardSettings.saved', { defaultValue: 'Dashboard settings saved.' })),
      onError: () => toast.error(t('common.somethingWentWrong', { defaultValue: 'Something went wrong.' })),
    })
  }

  const handleDelete = (key: string) =>
    remove.mutate(key, {
      onSuccess: () => toast.success(t('dashboardSettings.widgetremoved', { defaultValue: 'Widget removed.' })),
      onError: () => toast.error(t('common.somethingWentWrong', { defaultValue: 'Something went wrong.' })),
    })

  const handleToggleActive = (key: string, isActive: boolean) =>
    update.mutate(
      { key, is_active: isActive },
      { onError: () => toast.error(t('common.somethingWentWrong', { defaultValue: 'Something went wrong.' })) },
    )

  const activeWidget = data?.widgets.find((w) => w.key === activeKey) ?? null
  const total = data?.roles.length ?? 0

  return (
    <Space direction="vertical" size={14} className="w-full">
      <PageHeader
        title={t('dashboardSettings.title', { defaultValue: 'Dashboard Setting' })}
        subtitle={t('dashboardSettings.subtitle', {
          defaultValue: 'Pick a widget, then choose which roles can see it. A user sees a widget if any of their roles allows it.',
        })}
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={save.isPending} disabled={!dirty} onClick={handleSave}>
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        }
      />

      {isLoading ? (
        <Card><div className="flex justify-center py-16"><Spin /></div></Card>
      ) : !data || total === 0 ? (
        <Card><Empty className="py-10" description={t('dashboardSettings.noRoles', { defaultValue: 'No roles found.' })} /></Card>
      ) : (
        <Row gutter={[14, 14]}>
          {/* Left: widget list */}
          <Col xs={24} md={9} lg={8} xl={7}>
            <Card
              size="small"
              title={
                <Space size={8}>
                  <AppstoreOutlined style={{ color: primaryColor }} />
                  <span>{t('dashboardSettings.widgets', { defaultValue: 'Widgets' })}</span>
                </Space>
              }
              extra={
                <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                  {t('common.add', { defaultValue: 'Add' })}
                </Button>
              }
              styles={{ body: { padding: 6 } }}
            >
              <div className="flex flex-col gap-1">
                {data.widgets.map((w) => {
                  const active = w.key === activeKey
                  const hidden = w.is_active === false
                  const count = enabledCount(w.key)
                  const all = count === total
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setActiveKey(w.key)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors"
                      style={{
                        background: active ? `${primaryColor}14` : 'transparent',
                        boxShadow: active ? `inset 2px 0 0 ${primaryColor}` : 'none',
                        opacity: hidden ? 0.5 : 1,
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                        style={{
                          background: active ? primaryColor : `${primaryColor}14`,
                          color: active ? '#fff' : primaryColor,
                        }}
                      >
                        {widgetIcon(w)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <Text strong={active} className="!text-[13px]" delete={hidden}>{label(w)}</Text>
                      </span>
                      {hidden ? (
                        <span className="shrink-0 rounded-full bg-[rgba(148,163,184,0.16)] px-2 py-0.5 text-[11px] font-medium text-[#64748b]">
                          {t('dashboardSettings.off', { defaultValue: 'Off' })}
                        </span>
                      ) : (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
                          style={{
                            background: all ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.16)',
                            color: all ? '#16a34a' : '#64748b',
                          }}
                        >
                          {count}/{total}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          </Col>

          {/* Right: role assignment for the selected widget */}
          <Col xs={24} md={15} lg={16} xl={17}>
            <Card
              size="small"
              title={
                activeWidget ? (
                  <Space size={8}>
                    <span style={{ color: primaryColor }}>{widgetIcon(activeWidget)}</span>
                    <span>{label(activeWidget)}</span>
                  </Space>
                ) : (
                  t('dashboardSettings.selectWidget', { defaultValue: 'Select a widget' })
                )
              }
              extra={
                activeWidget && (
                  <Space size={8}>
                    <Space size={4}>
                      <Text type="secondary" className="!text-[12px]">
                        {t('dashboardSettings.showOnDashboard', { defaultValue: 'Show on dashboard' })}
                      </Text>
                      <Switch
                        size="small"
                        checked={activeWidget.is_active !== false}
                        loading={update.isPending}
                        onChange={(v) => handleToggleActive(activeWidget.key, v)}
                      />
                    </Space>
                    <Text type="secondary">·</Text>
                    <Button type="link" size="small" onClick={() => setAllRoles(activeWidget.key, true)}>
                      {t('dashboardSettings.enableAll', { defaultValue: 'Enable all' })}
                    </Button>
                    <Button type="link" size="small" onClick={() => setAllRoles(activeWidget.key, false)}>
                      {t('dashboardSettings.disableAll', { defaultValue: 'Disable all' })}
                    </Button>
                    {!isBuiltinWidget(activeWidget.key) && (
                      <Popconfirm
                        title={t('dashboardSettings.deleteWidget', { defaultValue: 'Delete this widget?' })}
                        okButtonProps={{ danger: true, loading: remove.isPending }}
                        onConfirm={() => handleDelete(activeWidget.key)}
                      >
                        <Tooltip title={t('common.delete', { defaultValue: 'Delete' })}>
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </Space>
                )
              }
              styles={{ body: { padding: 6 } }}
            >
              {activeWidget ? (
                (() => {
                  const widgetHidden = activeWidget.is_active === false
                  return (
                    <>
                      {widgetHidden && (
                        <div
                          className="mb-1 rounded-lg px-3 py-2 text-[12px]"
                          style={{ background: 'rgba(148,163,184,0.12)', color: '#64748b' }}
                        >
                          {t('dashboardSettings.hiddenNote', {
                            defaultValue: 'This widget is hidden from every dashboard. Turn on “Show on dashboard” to use the per-role settings below.',
                          })}
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2" style={{ opacity: widgetHidden ? 0.5 : 1 }}>
                        {data.roles.map((role) => {
                          const on = draft[role.id]?.[activeWidget.key] ?? true
                          return (
                            <label
                              key={role.id}
                              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                            >
                              <span className="min-w-0 flex-1">
                                <Text className="!text-[13px]">{role.name}</Text>
                                <Text type="secondary" className="!ml-2 !text-[11px]">
                                  {on
                                    ? t('dashboardSettings.visible', { defaultValue: 'Visible' })
                                    : t('dashboardSettings.hidden', { defaultValue: 'Hidden' })}
                                </Text>
                              </span>
                              <Switch
                                size="small"
                                disabled={widgetHidden}
                                checked={on}
                                onChange={(v) => setRoleWidget(role.id, activeWidget.key, v)}
                              />
                            </label>
                          )
                        })}
                      </div>
                    </>
                  )
                })()
              ) : (
                <Empty className="py-10" description={t('dashboardSettings.selectWidget', { defaultValue: 'Select a widget' })} />
              )}
            </Card>
          </Col>
        </Row>
      )}

      <AddWidgetDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </Space>
  )
}

export default DashboardSettingsPage
