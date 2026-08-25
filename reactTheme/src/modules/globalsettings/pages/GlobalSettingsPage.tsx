import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Empty, Pagination, Popconfirm, Row, Space, Spin, theme, Tooltip, Typography } from 'antd'
import { useEffect, useState, type CSSProperties } from 'react'
import PageHeader from '../../../components/PageHeader'
import { useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddGlobalSettingDrawer from '../components/AddGlobalSettingDrawer'
import EditGlobalSettingDrawer from '../components/EditGlobalSettingDrawer'
import RecordDrawer from '../components/RecordDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../globalSettingsSlice'
import { useGlobalSetting, useGlobalSettings, useDeleteGlobalSetting, useRecords } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { hexToRgba } from '../../../utils/color'
import { toast } from '../../../utils/toast'

const { Text } = Typography

// Fetch just the latest existing value-set to pre-populate the drawer.
const LATEST_RECORD_PARAMS = { page: 1, per_page: 1 }

function GlobalSettingsPage() {
  const dispatch = useAppDispatch()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const { token } = theme.useToken()
  // URL-backed table state + deep-linkable Add/Edit drawers (?add / ?edit=<id>),
  // mirroring the Users module — shareable and refresh-proof.
  const table = useUrlTable(15, 'Search applications…')
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.globalSettings.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.globalSettings.editDrawerOpen)
  const editing = useAppSelector((state) => state.globalSettings.editing)
  const { data, isLoading } = useGlobalSettings(table.params)
  const remove = useDeleteGlobalSetting()

  // Values drawer — clicking "Add values" opens it inline (no page redirect).
  const [valuesAppId, setValuesAppId] = useState<number | null>(null)
  const { data: valuesApp, isLoading: valuesLoading } = useGlobalSetting(valuesAppId)
  // Pre-populate with the app's latest saved values, if any.
  const { data: latestRecords, isFetching: recordsFetching } = useRecords(
    valuesAppId ?? 0,
    LATEST_RECORD_PARAMS,
  )
  const existingRecord = valuesAppId ? (latestRecords?.data?.[0] ?? null) : null

  const apps = data?.data ?? []
  const total = data?.meta.total ?? 0

  // The URL drives the drawers: ?add opens Add; ?edit=<id> opens Edit for the
  // matching app on the current page. No param → both closed.
  useEffect(() => {
    if (drawer.add) {
      if (!addOpen) dispatch(openAddDrawer())
    } else if (drawer.editId != null) {
      const match = apps.find((a) => a.id === drawer.editId)
      if (match && editing?.id !== match.id) dispatch(openEditDrawer(match))
    } else {
      if (addOpen) dispatch(closeAddDrawer())
      if (editOpen) dispatch(closeEditDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add, drawer.editId, data])

  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Global Settings"
        subtitle="Build applications with custom fields, then add records to them."
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
              Add Application
            </Button>
          </Space>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <Empty description="No applications yet. Create one to get started." />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {apps.map((app) => {
              const fieldCount = app.fields_count ?? 0
              const configured = (app.records_count ?? 0) > 0

              return (
                <Col key={app.id} xs={24} sm={12} lg={6}>
                  {/* --gs-accent lets the hover border follow the themeable primary
                      color, which a static Tailwind class can't express. */}
                  <Card
                    className="group h-full transition duration-200 hover:-translate-y-0.5 hover:!border-[var(--gs-accent)] hover:shadow-md"
                    style={{ '--gs-accent': primaryColor } as CSSProperties}
                    styles={{ body: { padding: 20, height: '100%' } }}
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
                          style={{ background: hexToRgba(primaryColor, 0.12), color: primaryColor }}
                        >
                          <AppstoreOutlined />
                        </div>

                        {/* Dimmed rather than hidden: a hover-only reveal would put
                            these out of reach on touch devices. */}
                        <Space
                          size={0}
                          className="opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                        >
                          <Tooltip title="Edit fields">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => drawer.openEdit(app.id)}
                            />
                          </Tooltip>
                          <Popconfirm title="Delete this application?" onConfirm={() => handleDelete(app.id)}>
                            <Tooltip title="Delete">
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                            </Tooltip>
                          </Popconfirm>
                        </Space>
                      </div>

                      <div className="mt-4 min-w-0 flex-1">
                        <Tooltip title={app.name}>
                          <Text strong className="!block !truncate !text-base">
                            {app.name}
                          </Text>
                        </Tooltip>

                        <div className="mt-1.5 flex items-center gap-2">
                          <Text type="secondary" className="!text-xs">
                            {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
                          </Text>
                          <span
                            className="size-1 shrink-0 rounded-full"
                            style={{ background: token.colorTextQuaternary }}
                          />
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ background: configured ? token.colorSuccess : token.colorTextQuaternary }}
                            />
                            <Text type="secondary" className="!text-xs">
                              {configured ? 'Configured' : 'Not set'}
                            </Text>
                          </span>
                        </div>
                      </div>

                      {/* The flex-1 block above pushes this to the bottom, so the
                          actions line up across the row even if a card grows. */}
                      <Button
                        className="!mt-5"
                        block
                        icon={<SettingOutlined />}
                        disabled={fieldCount === 0}
                        onClick={() => setValuesAppId(app.id)}
                      >
                        {configured ? 'Edit values' : 'Add values'}
                      </Button>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>

          {total > table.pageSize && (
            <div className="flex justify-end">
              <Pagination
                current={table.page}
                pageSize={table.pageSize}
                total={total}
                showSizeChanger
                onChange={(page, pageSize) => table.setPage(page, pageSize)}
              />
            </div>
          )}
        </>
      )}

      <AddGlobalSettingDrawer />
      <EditGlobalSettingDrawer />

      <RecordDrawer
        appId={valuesAppId ?? 0}
        fields={valuesApp?.fields ?? []}
        loading={valuesLoading || recordsFetching}
        open={valuesAppId !== null}
        record={existingRecord}
        onClose={() => setValuesAppId(null)}
      />
    </Space>
  )
}

export default GlobalSettingsPage
