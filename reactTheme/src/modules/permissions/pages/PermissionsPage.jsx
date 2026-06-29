import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import PageHeader from '../../../components/PageHeader'
import AddPermissionDrawer from '../components/AddPermissionDrawer'
import EditPermissionDrawer from '../components/EditPermissionDrawer'
import { openAddDrawer, openEditDrawer } from '../../../store/permissionsSlice'
import { usePermissions } from '../queries'

const { Text } = Typography

const ACTION_COLORS = {
  view: 'blue',
  create: 'green',
  edit: 'orange',
  delete: 'red',
  export: 'purple',
  manage: 'cyan',
}

function PermissionsPage() {
  const dispatch = useDispatch()
  const { data: permissions = [], isLoading } = usePermissions()

  const columns = useMemo(
    () => [
      {
        title: 'Permission',
        dataIndex: 'name',
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
        render: (action) => (
          <Tag color={ACTION_COLORS[action] ?? 'default'}>{action}</Tag>
        ),
      },
      {
        title: 'Assigned Roles',
        dataIndex: 'roles',
        render: (roles = []) =>
          roles.length ? (
            <Space size={[4, 4]} wrap>
              {roles.map((role) => (
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

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Permissions"
        subtitle="Fine-grained capabilities mapped to roles."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dispatch(openAddDrawer())}
          >
            Add Permission
          </Button>
        }
      />

      <Card styles={{ body: { padding: 18 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={permissions}
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>

      <AddPermissionDrawer />
      <EditPermissionDrawer />
    </Space>
  )
}

export default PermissionsPage
