import { DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useServerTable } from '../../../components/DataTable'
import CreateTenantDrawer from '../components/CreateTenantDrawer'
import { useDeleteTenant, useSetTenantStatus, useTenants } from '../queries'
import { toast } from '../../../utils/toast'
import type { Tenant } from '../types'

const { Text } = Typography

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
      { title: 'Tenant', dataIndex: 'name', render: (name, r) => (
        <div>
          <Text strong className="!block">{name}</Text>
          <Text type="secondary" className="!text-xs">{r.id}</Text>
        </div>
      ) },
      {
        title: 'Domains',
        dataIndex: 'domains',
        render: (domains: string[]) =>
          domains?.length ? domains.map((d) => <Tag key={d}>{d}</Tag>) : <Text type="secondary">—</Text>,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 110,
        render: (status: string) => (
          <Tag color={status === 'active' ? 'success' : 'warning'}>{status}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 140,
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

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Tenants"
        subtitle="Provision and manage tenant workspaces (each gets its own database)."
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
        columns={columns}
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
