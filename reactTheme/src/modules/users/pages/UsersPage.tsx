import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Popconfirm, Row, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import AddUserDrawer from '../components/AddUserDrawer'
import EditUserDrawer from '../components/EditUserDrawer'
import { useUsersPaginated, useUserStats, useRoles, useDeleteUser } from '../queries'
import { openAddDrawer, openEditDrawer } from '../usersSlice'
import { hexToRgba } from '../../../utils/color'
import { toast } from '../../../utils/toast'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import type { User } from '../../../types/models'

const { Text } = Typography

function UsersPage() {
  const dispatch = useAppDispatch()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const table = useServerTable(15, 'Search users by name, email, or role…')

  const { data, isFetching } = useUsersPaginated(table.params)
  const { data: stats } = useUserStats()
  const { data: roles = [] } = useRoles()
  const removeUser = useDeleteUser()

  const handleDelete = (id: number) =>
    removeUser.mutate(id, {
      onSuccess: () => toast.success('User deleted'),
      onError: () => toast.error('Unable to delete user'),
    })

  const columns = useMemo<ColumnsType<User>>(
    () => [
      {
        title: 'User',
        dataIndex: 'name',
        sorter: true,
        render: (_, user) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <Avatar
              src={user.avatar || undefined}
              style={{
                backgroundColor: hexToRgba(primaryColor, 0.12),
                color: primaryColor,
                fontWeight: 600,
              }}
              icon={!user.name ? <UserOutlined /> : undefined}
            >
              {user.name && !user.avatar ? user.name.charAt(0).toUpperCase() : null}
            </Avatar>
            <div className="min-w-0">
              <Text strong className="!block !truncate">
                {user.name}
              </Text>
              <Text type="secondary" className="!block !truncate !text-xs">
                {user.email}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Roles',
        dataIndex: 'roles',
        render: (userRoles) =>
          userRoles?.length ? (
            <Space size={[4, 4]} wrap>
              {userRoles.map((role: string) => (
                <Tag key={role} color="processing" icon={<SafetyCertificateOutlined />}>
                  {role}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">No role</Text>
          ),
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        sorter: true,
        render: (date) => (date ? dayjs(date).format('MMM D, YYYY') : '—'),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 110,
        render: (_, user) => (
          <Space>
            <Tooltip title="Edit user">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => dispatch(openEditDrawer(user))}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this user?"
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(user.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [dispatch, primaryColor],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  const summaryCards = [
    { title: 'Total Users', value: stats?.total ?? 0, icon: <TeamOutlined />, color: primaryColor },
    { title: 'Roles', value: roles.length, icon: <SafetyCertificateOutlined />, color: '#8b5cf6' },
    { title: 'With a Role', value: stats?.with_role ?? 0, icon: <UserAddOutlined />, color: '#22c55e' },
    { title: 'Without a Role', value: stats?.without_role ?? 0, icon: <UserOutlined />, color: '#f59e0b' },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Users"
        subtitle="Manage users, roles, and account access."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
              Add User
            </Button>
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        {summaryCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Row>

      <DataTable<User>
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

      <AddUserDrawer />
      <EditUserDrawer />
    </Space>
  )
}

export default UsersPage
