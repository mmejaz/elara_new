import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddPermissionDrawer from '../components/AddPermissionDrawer'
import EditPermissionDrawer from '../components/EditPermissionDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../permissionsSlice'
import { usePermissionsPaginated } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
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
  const table = useUrlTable(15, 'Search permissions…')
  // Drawers are deep-linkable: ?add=true / ?edit=<id> (see the URL→drawer effect).
  const drawer = useUrlDrawer()
  const addDrawerOpen = useAppSelector((state) => state.permissions.addDrawerOpen)
  const editDrawerOpen = useAppSelector((state) => state.permissions.editDrawerOpen)
  const editingPermission = useAppSelector((state) => state.permissions.editingPermission)
  const { data, isFetching } = usePermissionsPaginated(table.params)

  // The URL drives the drawers. ?add=true opens Add; ?edit=<id> opens Edit for
  // the matching row on the current page (its page/search are in the URL too, so
  // a pasted link reloads the same list). No param → both drawers closed.
  useEffect(() => {
    if (drawer.add) {
      if (!addDrawerOpen) dispatch(openAddDrawer())
    } else if (drawer.editId != null) {
      const match = data?.data.find((p) => p.id === drawer.editId)
      if (match && editingPermission?.id !== match.id) dispatch(openEditDrawer(match))
    } else {
      if (addDrawerOpen) dispatch(closeAddDrawer())
      if (editDrawerOpen) dispatch(closeEditDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add, drawer.editId, data])

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
              onClick={() => drawer.openEdit(permission.id)}
            />
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawer.openEdit],
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
              onClick={() => drawer.openAdd()}
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
