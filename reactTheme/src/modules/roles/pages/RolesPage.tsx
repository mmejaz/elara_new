import { EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import AddRoleDrawer from '../components/AddRoleDrawer'
import EditRoleDrawer from '../components/EditRoleDrawer'
import { openAddDrawer, openEditDrawer } from '../rolesSlice'
import { usePaginatedRoles } from '../queries'
import { useAppDispatch } from '../../../store/hooks'
import type { Role } from '../../../types/models'

const { Text } = Typography

function RolesPage() {
  const dispatch = useAppDispatch()
  const table = useServerTable(15, 'Search roles…')
  const { data, isLoading } = usePaginatedRoles(table.params)

  const columns = useMemo<ColumnsType<Role>>(
    () => [
      {
        title: 'Role',
        dataIndex: 'name',
        sorter: true,
        render: (name) => (
          <Tag color="processing" icon={<SafetyCertificateOutlined />}>
            {name}
          </Tag>
        ),
      },
      {
        title: 'Users',
        dataIndex: 'users_count',
        render: (count) => <Text>{count ?? 0}</Text>,
      },
      {
        title: 'Permissions',
        dataIndex: 'permissions_count',
        render: (count) => <Text strong>{count ?? 0}</Text>,
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, role) => (
          <Tooltip title="Edit Role">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => dispatch(openEditDrawer(role))}
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
        title="Roles"
        subtitle="Define what each group of users can access."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => dispatch(openAddDrawer())}
            >
              Add Role
            </Button>
          </Space>
        }
      />

      <DataTable<Role>
        columns={visibleColumns}
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

      <AddRoleDrawer />
      <EditRoleDrawer />
    </Space>
  )
}

export default RolesPage
