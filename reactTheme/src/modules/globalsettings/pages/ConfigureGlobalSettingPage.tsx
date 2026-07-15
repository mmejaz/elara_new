import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useServerTable } from '../../../components/DataTable'
import RecordDrawer from '../components/RecordDrawer'
import { useGlobalSetting, useRecords, useDeleteRecord } from '../queries'
import { toast } from '../../../utils/toast'
import type { GlobalSettingField, GlobalSettingRecord } from '../types'

const { Text } = Typography

function renderValue(field: GlobalSettingField, value: unknown) {
  if (value === null || value === undefined || value === '') return <Text type="secondary">—</Text>
  if (field.type === 'boolean') return <Tag color={value ? 'success' : 'default'}>{value ? 'Yes' : 'No'}</Tag>
  if (field.type === 'password') return <Text type="secondary">••••••••</Text>
  if (field.type === 'dropdown') return <Tag>{String(value)}</Tag>
  return <Text>{String(value)}</Text>
}

function ConfigureGlobalSettingPage() {
  const params = useParams({ strict: false }) as { id?: string }
  const appId = Number(params.id)
  const navigate = useNavigate()

  const { data: app } = useGlobalSetting(appId || null)
  const table = useServerTable(15, 'Search records…')
  const { data, isLoading } = useRecords(appId, table.params)
  const remove = useDeleteRecord(appId)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<GlobalSettingRecord | null>(null)

  const fields = app?.fields ?? []

  const openAdd = () => {
    setEditing(null)
    setDrawerOpen(true)
  }
  const openEdit = (record: GlobalSettingRecord) => {
    setEditing(record)
    setDrawerOpen(true)
  }
  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Record deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  const columns = useMemo<ColumnsType<GlobalSettingRecord>>(() => {
    const fieldCols: ColumnsType<GlobalSettingRecord> = fields.map((f) => ({
      title: f.label,
      key: f.key,
      render: (_, record) => renderValue(f, record.data?.[f.key]),
    }))

    return [
      ...fieldCols,
      {
        title: 'Actions',
        key: 'actions',
        width: 110,
        render: (_, record) => (
          <Space>
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            </Tooltip>
            <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={app ? `${app.name} — Records` : 'Records'}
        subtitle="Add and manage the entries for this application."
        titleExtra={
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate({ to: '/globalsettings' })}
          >
            Back
          </Button>
        }
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} disabled={fields.length === 0}>
              Add Record
            </Button>
          </Space>
        }
      />

      <DataTable<GlobalSettingRecord>
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        searchable={false}
        showColumnToggle={false}
        server={{
          total: data?.meta.total ?? 0,
          page: table.page,
          pageSize: table.pageSize,
          onChange: table.onChange,
        }}
      />

      <RecordDrawer
        appId={appId}
        fields={fields}
        open={drawerOpen}
        record={editing}
        onClose={() => setDrawerOpen(false)}
      />
    </Space>
  )
}

export default ConfigureGlobalSettingPage
