import {
  ApartmentOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { App, Avatar, Button, Card, Dropdown, Pagination, Row, Segmented, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddUserDrawer from '../components/AddUserDrawer'
import EditUserDrawer from '../components/EditUserDrawer'
import { useUsersPaginated, useUserStats, useRoles, useDeleteUser, useImpersonate, useUpdateUserStatus } from '../queries'
import UserStatusModal from '../components/UserStatusModal'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../usersSlice'
import { hexToRgba } from '../../../utils/color'
import { notify, toast } from '../../../utils/toast'
import { serverMessage } from '../../../utils/formErrors'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import type { User } from '../../../types/models'

const { Text } = Typography

function UsersPage() {
  const dispatch = useAppDispatch()
  const { modal } = App.useApp()
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const currentUserId = useAppSelector((state) => state.auth.user?.id)
  const canImpersonate = useAppSelector((state) => state.auth.roles.includes('Super Admin'))
  const canManageStatus = useAppSelector((state) => state.auth.permissions.includes('users.edit'))
  const table = useUrlTable(15, 'Search users by name, email, or role…')
  // Drawers are deep-linkable: ?add=true / ?edit=<id> (see the URL→drawer effect).
  const drawer = useUrlDrawer()
  const addDrawerOpen = useAppSelector((state) => state.users.addDrawerOpen)
  const editDrawerOpen = useAppSelector((state) => state.users.editDrawerOpen)
  const editingUser = useAppSelector((state) => state.users.editingUser)

  // Deactivate/block open a reason modal; reactivate is a direct action.
  const [statusTarget, setStatusTarget] = useState<{
    user: User
    status: 'deactivated' | 'blocked'
  } | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const updateStatus = useUpdateUserStatus()

  const { data, isFetching } = useUsersPaginated(table.params)
  const { data: stats } = useUserStats()
  const { data: roles = [] } = useRoles()

  // The URL drives the drawers. ?add=true opens Add; ?edit=<id> opens Edit for
  // the matching row on the current page (its page/search are in the URL too, so
  // a pasted link reloads the same list). No param → both drawers closed.
  useEffect(() => {
    if (drawer.add) {
      if (!addDrawerOpen) dispatch(openAddDrawer())
    } else if (drawer.editId != null) {
      const match = data?.data.find((u) => u.id === drawer.editId)
      if (match && editingUser?.id !== match.id) dispatch(openEditDrawer(match))
    } else {
      if (addDrawerOpen) dispatch(closeAddDrawer())
      if (editDrawerOpen) dispatch(closeEditDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add, drawer.editId, data])
  const removeUser = useDeleteUser()
  const impersonate = useImpersonate()

  const handleDelete = (id: number) =>
    removeUser.mutate(id, {
      onSuccess: () => toast.success('User deleted'),
      onError: () => toast.error('Unable to delete user'),
    })

  // Row actions, shared by the table column and the grid cards. Same guards:
  // never act on yourself or a Super Admin.
  const actionItems = useCallback(
    (user: User): MenuProps['items'] => {
      const canTarget = user.id !== currentUserId && !user.roles?.includes('Super Admin')
      const isActive = (user.status ?? 'active') === 'active'
      const items: MenuProps['items'] = []

      if (canImpersonate && canTarget) {
        items.push({
          key: 'impersonate',
          icon: <UserSwitchOutlined />,
          label: 'Impersonate',
          onClick: () =>
            impersonate.mutate(user.id, {
              onSuccess: () => toast.success(`You are now viewing as ${user.name}.`),
              onError: (error) => toast.error(serverMessage(error, 'Unable to impersonate this user')),
            }),
        })
      }

      if (canManageStatus && canTarget) {
        if (isActive) {
          items.push(
            {
              key: 'deactivate',
              icon: <PauseCircleOutlined />,
              label: 'Deactivate',
              onClick: () => setStatusTarget({ user, status: 'deactivated' }),
            },
            {
              key: 'block',
              icon: <StopOutlined />,
              label: 'Block',
              danger: true,
              onClick: () => setStatusTarget({ user, status: 'blocked' }),
            },
          )
        } else {
          items.push({
            key: 'reactivate',
            icon: <CheckCircleOutlined />,
            label: 'Reactivate',
            onClick: () =>
              modal.confirm({
                title: `Reactivate ${user.name}?`,
                okText: 'Reactivate',
                onOk: () =>
                  updateStatus.mutate(
                    { id: user.id, status: 'active' },
                    {
                      onSuccess: () =>
                        notify.success('Account reactivated', `${user.name} has been reactivated.`),
                      onError: (error) => toast.error(serverMessage(error, 'Unable to reactivate')),
                    },
                  ),
              }),
          })
        }
      }

      items.push(
        { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => drawer.openEdit(user.id) },
        { type: 'divider' },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete',
          danger: true,
          onClick: () =>
            modal.confirm({
              title: 'Delete this user?',
              okText: 'Delete',
              okButtonProps: { danger: true },
              onOk: () => handleDelete(user.id),
            }),
        },
      )

      return items
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canImpersonate, canManageStatus, currentUserId, impersonate.mutate, updateStatus.mutate, modal, drawer.openEdit],
  )

  const actionsDropdown = (user: User) => (
    <Dropdown menu={{ items: actionItems(user) }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<MoreOutlined />} aria-label="Row actions" />
    </Dropdown>
  )

  const columns = useMemo<ColumnsType<User>>(
    () => [
      {
        title: 'User ID',
        dataIndex: 'user_code',
        width: 120,
        render: (code: string) => <Text code className="!text-xs">{code ?? '—'}</Text>,
      },
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
        title: 'Department',
        dataIndex: 'department',
        render: (department: { id: number; name: string } | null) =>
          department ? (
            <Tag color="geekblue" icon={<ApartmentOutlined />}>{department.name}</Tag>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 130,
        render: (status: string = 'active', user) => {
          const map = {
            active: { color: 'success', label: 'Active' },
            deactivated: { color: 'warning', label: 'Deactivated' },
            blocked: { color: 'error', label: 'Blocked' },
          } as const
          const s = map[status as keyof typeof map] ?? map.active
          const tag = <Tag color={s.color}>{s.label}</Tag>
          return user.status_reason ? (
            <Tooltip title={user.status_reason}>{tag}</Tooltip>
          ) : (
            tag
          )
        },
      },
      {
        title: 'Organizations',
        dataIndex: 'organizations',
        render: (orgs: { id: number; name: string }[] | undefined) =>
          orgs?.length ? (
            <Space size={[4, 4]} wrap>
              {orgs.map((org) => (
                <Tag key={org.id} color="cyan" icon={<ApartmentOutlined />}>
                  {org.name}
                </Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 90,
        align: 'center',
        render: (_, user) => actionsDropdown(user),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryColor, actionItems],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  const summaryCards = [
    { title: 'Total Users', value: stats?.total ?? 0, icon: <TeamOutlined />, color: primaryColor },
    { title: 'Roles', value: roles.length, icon: <SafetyCertificateOutlined />, color: '#8b5cf6' },
    { title: 'With a Role', value: stats?.with_role ?? 0, icon: <UserAddOutlined />, color: '#22c55e' },
    { title: 'Without a Role', value: stats?.without_role ?? 0, icon: <UserOutlined />, color: '#f59e0b' },
  ]

  const STATUS_MAP = {
    active: { color: 'success', label: 'Active' },
    deactivated: { color: 'warning', label: 'Deactivated' },
    blocked: { color: 'error', label: 'Blocked' },
  } as const

  const renderUserCard = (user: User) => {
    const s = STATUS_MAP[(user.status ?? 'active') as keyof typeof STATUS_MAP] ?? STATUS_MAP.active
    return (
      <Card key={user.id} styles={{ body: { padding: 16 } }} className="h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              src={user.avatar || undefined}
              style={{ backgroundColor: hexToRgba(primaryColor, 0.12), color: primaryColor, fontWeight: 600 }}
              icon={!user.name ? <UserOutlined /> : undefined}
            >
              {user.name && !user.avatar ? user.name.charAt(0).toUpperCase() : null}
            </Avatar>
            <div className="min-w-0">
              <Text strong className="!block !truncate">{user.name}</Text>
              <Text type="secondary" className="!block !truncate !text-xs">{user.email}</Text>
            </div>
          </div>
          {actionsDropdown(user)}
        </div>

        <div className="mt-3 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <Text type="secondary">User ID</Text>
            <Text code className="!text-xs">{user.user_code ?? '—'}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text type="secondary">Status</Text>
            {user.status_reason ? (
              <Tooltip title={user.status_reason}><Tag color={s.color}>{s.label}</Tag></Tooltip>
            ) : (
              <Tag color={s.color}>{s.label}</Tag>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <Text type="secondary">Department</Text>
            {user.department ? (
              <Tag color="geekblue" icon={<ApartmentOutlined />}>{user.department.name}</Tag>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Text type="secondary">Roles</Text>
            {user.roles?.length ? (
              <Space size={[4, 4]} wrap>
                {user.roles.map((role) => (
                  <Tag key={role} color="processing" icon={<SafetyCertificateOutlined />}>{role}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">No role</Text>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Text type="secondary">Organizations</Text>
            {user.organizations?.length ? (
              <Space size={[4, 4]} wrap>
                {user.organizations.map((org) => (
                  <Tag key={org.id} color="cyan" icon={<ApartmentOutlined />}>{org.name}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const viewSwitcher = (
    <Segmented
      value={view}
      onChange={(v) => setView(v as 'list' | 'grid')}
      options={[
        { value: 'list', icon: <UnorderedListOutlined /> },
        { value: 'grid', icon: <AppstoreOutlined /> },
      ]}
    />
  )

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Users"
        subtitle="Manage users, roles, and account access."
        titleExtra={view === 'list' ? control : undefined}
        extra={
          <Space>
            {viewSwitcher}
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
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

      {view === 'list' ? (
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
      ) : (
        <Spin spinning={isFetching}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.data ?? []).map(renderUserCard)}
          </div>
          {(data?.data?.length ?? 0) === 0 && !isFetching && (
            <div className="py-12 text-center">
              <Text type="secondary">No users found</Text>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Pagination
              current={table.page}
              pageSize={table.pageSize}
              total={data?.meta.total ?? 0}
              showSizeChanger
              onChange={(p, ps) => table.setPage(p, ps)}
            />
          </div>
        </Spin>
      )}

      <AddUserDrawer />
      <EditUserDrawer />
      <UserStatusModal
        user={statusTarget?.user ?? null}
        status={statusTarget?.status ?? null}
        onClose={() => setStatusTarget(null)}
      />
    </Space>
  )
}

export default UsersPage
