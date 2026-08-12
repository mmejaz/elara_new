import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import AddPermissionDrawer from '../components/AddPermissionDrawer'
import EditPermissionDrawer from '../components/EditPermissionDrawer'
import { openAddDrawer, openEditDrawer } from '../permissionsSlice'
import { usePermissionsPaginated } from '../queries'
import { useAppDispatch } from '../../../store/hooks'
import type { Permission } from '../../../types/models'

const { Text } = Typography

const ACTION_COLORS: Record<string, string> = {
  view: 'blue',
  create: 'green',
  edit: 'orange',
  delete: 'red',
  export: 'purple',
  manage: 'cyan',
}

function PermissionsPage() {
  const dispatch = useAppDispatch()
  const table = useServerTable(15, 'Search permissions…')
  const { data, isFetching } = usePermissionsPaginated(table.params)

  const columns = useMemo<ColumnsType<Permission>>(
    () => [
      {
        title: 'Permission',
        dataIndex: 'name',
        sorter: true,
        render: (name) => <Text code>{name}</Text>,
      },
      {
        title: 'Module',
        dataIndex: 'module',
        render: (module) => <Tag>{module}</Tag>,
      },
      {
        title: 'Action',
        dataIndex: 'action',
        render: (action) => <Tag color={ACTION_COLORS[action] ?? 'default'}>{action}</Tag>,
      },
      {
        title: 'Assigned Roles',
        dataIndex: 'roles',
        render: (roles = []) =>
          roles.length ? (
            <Space size={[4, 4]} wrap>
              {roles.map((role: string) => (
                <Tag key={role} color="processing">{role}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">None</Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, permission) => (
          <Tooltip title="Edit Permission">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => dispatch(openEditDrawer(permission))}
            />
          </Tooltip>
        ),
      },
    ],
    [dispatch],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Permissions"
        subtitle="Fine-grained capabilities mapped to roles."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => dispatch(openAddDrawer())}
            >
              Add Permission
            </Button>
          </Space>
        }
      />

      <DataTable<Permission>
        columns={visibleColumns}
        dataSource={data?.data ?? []}
        loading={isFetching}
        searchable={false}
        showColumnToggle={false}
        server={{
          total: data?.meta.total ?? 0,
          page: table.page,
          pageSize: table.pageSize,
          onChange: table.onChange,
        }}
      />

      <AddPermissionDrawer />
      <EditPermissionDrawer />
    </Space>
  )
}

export default PermissionsPage
