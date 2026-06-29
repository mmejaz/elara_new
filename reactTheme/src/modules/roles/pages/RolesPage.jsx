import { EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import AddRoleDrawer from '../components/AddRoleDrawer'
import EditRoleDrawer from '../components/EditRoleDrawer'
import { openAddDrawer, openEditDrawer } from '../../../store/rolesSlice'
import { useRoles } from '../queries'

const { Text } = Typography

function RolesPage() {
  const dispatch = useDispatch()
  const { data: roles = [], isLoading } = useRoles()

  const columns = useMemo(
    () => [
      {
        title: 'Role',
        dataIndex: 'name',
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

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Roles"
        subtitle="Define what each group of users can access."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dispatch(openAddDrawer())}
          >
            Add Role
          </Button>
        }
      />

      <Card styles={{ body: { padding: 18 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={roles}
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <AddRoleDrawer />
      <EditRoleDrawer />
    </Space>
  )
}

export default RolesPage
