import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Empty, Pagination, Popconfirm, Row, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import { useServerTable } from '../../../components/DataTable'
import AddGlobalSettingDrawer from '../components/AddGlobalSettingDrawer'
import EditGlobalSettingDrawer from '../components/EditGlobalSettingDrawer'
import RecordDrawer from '../components/RecordDrawer'
import { openAddDrawer, openEditDrawer } from '../globalSettingsSlice'
import { useGlobalSetting, useGlobalSettings, useDeleteGlobalSetting } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { hexToRgba } from '../../../utils/color'
import { toast } from '../../../utils/toast'

const { Text } = Typography

function GlobalSettingsPage() {
  const dispatch = useAppDispatch()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const table = useServerTable(15, 'Search applications…')
  const { data, isLoading } = useGlobalSettings(table.params)
  const remove = useDeleteGlobalSetting()

  // Values drawer — clicking "Add values" opens it inline (no page redirect).
  const [valuesAppId, setValuesAppId] = useState<number | null>(null)
  const { data: valuesApp, isLoading: valuesLoading } = useGlobalSetting(valuesAppId)

  const apps = data?.data ?? []
  const total = data?.meta.total ?? 0

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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
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
          <Row gutter={[12, 12]}>
            {apps.map((app) => (
              <Col key={app.id} xs={24} sm={12} lg={8}>
                <Card styles={{ body: { padding: 18 } }} className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="grid size-11 shrink-0 place-items-center rounded-lg text-lg"
                        style={{ background: hexToRgba(primaryColor, 0.12), color: primaryColor }}
                      >
                        <AppstoreOutlined />
                      </div>
                      <div className="min-w-0">
                        <Text strong className="!block !truncate">
                          {app.name}
                        </Text>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Tag color="blue" className="!text-xs">
                            {app.fields_count ?? 0} fields
                          </Tag>
                          <Tag className="!text-xs">{app.records_count ?? 0} records</Tag>
                        </div>
                      </div>
                    </div>

                    <Space size={0}>
                      <Tooltip title="Edit fields">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => dispatch(openEditDrawer(app))}
                        />
                      </Tooltip>
                      <Popconfirm title="Delete this application?" onConfirm={() => handleDelete(app.id)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>

                  <Button
                    className="!mt-4"
                    block
                    icon={<SettingOutlined />}
                    disabled={(app.fields_count ?? 0) === 0}
                    onClick={() => setValuesAppId(app.id)}
                  >
                    Add values
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          {total > table.pageSize && (
            <div className="flex justify-end">
              <Pagination
                current={table.page}
                pageSize={table.pageSize}
                total={total}
                showSizeChanger
                onChange={(page, pageSize) =>
                  table.onChange({ current: page, pageSize }, {}, {}, {
                    currentDataSource: [],
                    action: 'paginate',
                  })
                }
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
        loading={valuesLoading}
        open={valuesAppId !== null}
        record={null}
        onClose={() => setValuesAppId(null)}
      />
    </Space>
  )
}

export default GlobalSettingsPage
