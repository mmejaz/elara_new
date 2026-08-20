import { EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddRoleDrawer from '../components/AddRoleDrawer'
import EditRoleDrawer from '../components/EditRoleDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../rolesSlice'
import { usePaginatedRoles } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import type { Role } from '../../../types/models'

const { Text } = Typography

function RolesPage() {
  const dispatch = useAppDispatch()
  const table = useUrlTable(15, 'Search roles…')
  // Drawers are deep-linkable: ?add=true / ?edit=<id> (see the URL→drawer effect).
  const drawer = useUrlDrawer()
  const addDrawerOpen = useAppSelector((state) => state.roles.addDrawerOpen)
  const editDrawerOpen = useAppSelector((state) => state.roles.editDrawerOpen)
  const editingRole = useAppSelector((state) => state.roles.editingRole)
  const { data, isFetching } = usePaginatedRoles(table.params)

  // The URL drives the drawers. ?add=true opens Add; ?edit=<id> opens Edit for
  // the matching row on the current page (its page/search are in the URL too, so
  // a pasted link reloads the same list). No param → both drawers closed.
  useEffect(() => {
    if (drawer.add) {
      if (!addDrawerOpen) dispatch(openAddDrawer())
    } else if (drawer.editId != null) {
      const match = data?.data.find((r) => r.id === drawer.editId)
      if (match && editingRole?.id !== match.id) dispatch(openEditDrawer(match))
    } else {
      if (addDrawerOpen) dispatch(closeAddDrawer())
      if (editDrawerOpen) dispatch(closeEditDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add, drawer.editId, data])

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
              onClick={() => drawer.openEdit(role.id)}
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
        title="Roles"
        subtitle="Define what each group of users can access."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => drawer.openAdd()}
            >
              Add Role
            </Button>
          </Space>
        }
      />

      <DataTable<Role>
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

      <AddRoleDrawer />
      <EditRoleDrawer />
    </Space>
  )
}

export default RolesPage
