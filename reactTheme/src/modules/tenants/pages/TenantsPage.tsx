import { DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import CreateTenantDrawer from '../components/CreateTenantDrawer'
import { useDeleteTenant, useSetTenantStatus, useTenants } from '../queries'
import { toast } from '../../../utils/toast'
import type { Tenant } from '../types'

const { Text } = Typography

/** Shared placeholder so empty cells read consistently across every column. */
const dash = <Text type="secondary">—</Text>

function TenantsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const table = useServerTable(15, 'Search tenants…')
  const { data, isLoading } = useTenants(table.params)
  const remove = useDeleteTenant()
  const setStatus = useSetTenantStatus()

  const handleDelete = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Tenant deleted (database dropped)'),
      onError: () => toast.error('Unable to delete tenant'),
    })

  const toggleStatus = (record: Tenant) => {
    const next = record.status === 'active' ? 'suspended' : 'active'
    setStatus.mutate(
      { id: record.id, status: next },
      { onSuccess: () => toast.success(next === 'active' ? 'Tenant activated' : 'Tenant suspended') },
    )
  }

  const columns = useMemo<ColumnsType<Tenant>>(
    () => [
      {
        title: 'Tenant',
        dataIndex: 'name',
        sorter: true,
        width: 200,
        render: (name, r) => (
          <div>
            <Text strong className="!block">{name}</Text>
            <Text type="secondary" className="!text-xs">{r.id}</Text>
          </div>
        ),
      },
      {
        title: 'Domains',
        dataIndex: 'domains',
        width: 200,
        render: (domains: string[]) =>
          domains?.length
            ? domains.map((d) => (
                <Tag key={d}>
                  <a href={`http://${d}:5173`} target="_blank" rel="noreferrer">{d}</a>
                </Tag>
              ))
            : dash,
      },
      {
        title: 'Database',
        dataIndex: 'database',
        width: 160,
        render: (db: string | null) => (db ? <Text code className="!text-xs">{db}</Text> : dash),
      },
      {
        title: 'Admin',
        dataIndex: 'admin_email',
        width: 200,
        render: (email: string | null, r) =>
          email ? (
            <div>
              <Text className="!block">{r.admin_name ?? '—'}</Text>
              <Text type="secondary" className="!text-xs">{email}</Text>
            </div>
          ) : (
            dash
          ),
      },
      {
        title: 'Contact',
        dataIndex: 'email',
        width: 200,
        render: (email: string | null, r) =>
          email || r.phone ? (
            <div>
              <Text className="!block">{email ?? '—'}</Text>
              <Text type="secondary" className="!text-xs">{r.phone ?? '—'}</Text>
            </div>
          ) : (
            dash
          ),
      },
      {
        title: 'Timezone',
        dataIndex: 'timezone',
        width: 120,
        sorter: true,
        render: (v: string | null) => v ?? dash,
      },
      {
        title: 'Currency',
        dataIndex: 'currency',
        width: 100,
        sorter: true,
        render: (v: string | null) => v ?? dash,
      },
      {
        title: 'Language',
        dataIndex: 'language',
        width: 100,
        render: (v: string | null) => v ?? dash,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        sorter: true,
        render: (status: string) => (
          <Tag color={status === 'active' ? 'success' : 'warning'}>{status}</Tag>
        ),
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        width: 160,
        sorter: true,
        render: (v: string | null) => (v ? <Text className="!text-xs">{v}</Text> : dash),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        // The table now scrolls horizontally, so keep the controls reachable.
        fixed: 'right',
        render: (_, record) => (
          <Space>
            <Tooltip title={record.status === 'active' ? 'Suspend' : 'Activate'}>
              <Button
                type="text"
                icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => toggleStatus(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this tenant?"
              description="This drops its database permanently."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Tenants"
        subtitle="Provision and manage tenant workspaces (each gets its own database)."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Create Tenant
            </Button>
          </Space>
        }
      />
      <DataTable<Tenant>
        columns={visibleColumns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        showColumnToggle={false}
        searchable={false}
        server={{
          total: data?.meta.total ?? 0,
          page: table.page,
          pageSize: table.pageSize,
          onChange: table.onChange,
        }}
      />
      <CreateTenantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Space>
  )
}

export default TenantsPage
