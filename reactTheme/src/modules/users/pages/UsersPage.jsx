import {
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import AddUserDrawer from '../components/AddUserDrawer'
import { useUsers, useRoles } from '../queries'
import { openAddDrawer } from '../../../store/usersSlice'
import { hexToRgba } from '../../../utils/color'

const { Text } = Typography

function UsersPage() {
  const dispatch = useDispatch()
  const primaryColor = useSelector((state) => state.ui.primaryColor)
  const borderRadius = useSelector((state) => state.ui.borderRadius)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsers()
  const { data: roles = [] } = useRoles()

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role, label: role })),
    [roles],
  )

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return users.filter((user) => {
      const userRoles = user.roles ?? []
      const matchesSearch =
        !query ||
        [user.name, user.email, ...userRoles]
          .join(' ')
          .toLowerCase()
          .includes(query)
      const matchesRole = roleFilter === 'all' || userRoles.includes(roleFilter)

      return matchesSearch && matchesRole
    })
  }, [roleFilter, searchQuery, users])

  const columns = useMemo(
    () => [
      {
        title: 'User',
        dataIndex: 'name',
        render: (_, user) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <Avatar
              style={{
                backgroundColor: hexToRgba(primaryColor, 0.12),
                color: primaryColor,
                fontWeight: 600,
              }}
              icon={!user.name ? <UserOutlined /> : undefined}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : null}
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
              {userRoles.map((role) => (
                <Tag
                  key={role}
                  color="processing"
                  icon={<SafetyCertificateOutlined />}
                >
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
        render: (date) => (date ? dayjs(date).format('MMM D, YYYY') : '—'),
      },
    ],
    [primaryColor],
  )

  const assignedCount = users.filter((user) => user.roles?.length).length
  const summaryCards = [
    {
      title: 'Total Users',
      value: users.length,
      icon: <TeamOutlined />,
      color: primaryColor,
    },
    {
      title: 'Roles',
      value: roles.length,
      icon: <SafetyCertificateOutlined />,
      color: '#8b5cf6',
    },
    {
      title: 'With a Role',
      value: assignedCount,
      icon: <UserAddOutlined />,
      color: '#22c55e',
    },
    {
      title: 'Without a Role',
      value: users.length - assignedCount,
      icon: <UserOutlined />,
      color: '#f59e0b',
    },
  ]

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Users"
        subtitle="Manage users, roles, and account access."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dispatch(openAddDrawer())}
          >
            Add User
          </Button>
        }
      />

      <Row gutter={[12, 12]}>
        {summaryCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </Row>

      <Card className="w-full" styles={{ body: { padding: 18 } }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text strong className="!text-base">
              User Directory
            </Text>
            <Text type="secondary" className="!mt-1 !block !text-xs">
              Search and filter users from the (dummy) data source.
            </Text>
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ minWidth: 150 }}
            options={[{ value: 'all', label: 'All Roles' }, ...roleOptions]}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_100px]">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search users by name, email, or role"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            size="large"
            style={{ borderRadius }}
          />
          <Button
            icon={<ReloadOutlined />}
            size="large"
            style={{ borderRadius }}
            onClick={() => {
              setSearchQuery('')
              setRoleFilter('all')
              refetchUsers()
            }}
          >
            Reset
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          loading={usersLoading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>

      <AddUserDrawer />
    </Space>
  )
}

export default UsersPage
