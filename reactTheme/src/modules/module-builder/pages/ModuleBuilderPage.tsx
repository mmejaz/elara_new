import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Space, Table, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import AddModuleDrawer from '../components/AddModuleDrawer'
import { openAddDrawer } from '../moduleBuilderSlice'
import { useModules } from '../../../hooks/useModules'
import { useAppDispatch } from '../../../store/hooks'

const { Text } = Typography

function ModuleBuilderPage() {
  const dispatch = useAppDispatch()
  const { data: modules = [], isLoading, isError } = useModules()

  const columns = useMemo(
    () => [
      {
        title: 'Module',
        dataIndex: 'name',
        render: (name) => <Text strong>{name}</Text>,
      },
      {
        title: 'Type',
        key: 'type',
        render: (_, record) => {
          if (record.type === 'group') return <Tag color="geekblue">Group / Section</Tag>
          return record.resourceful ? (
            <Tag color="green">Resourceful · CRUD</Tag>
          ) : (
            <Tag color="gold">Parent Menu</Tag>
          )
        },
      },
      {
        title: 'Parent',
        dataIndex: 'parent',
        render: (parent) =>
          parent ? (
            <Text>{parent.startsWith('group:') ? parent.slice(6) : parent}</Text>
          ) : (
            <Text type="secondary">— top level —</Text>
          ),
      },
      {
        title: 'Permissions',
        dataIndex: 'permissions',
        render: (permissions = []) =>
          permissions.length ? (
            <Space size={[4, 4]} wrap>
              {permissions.map((p) => (
                <Tag key={p} color="blue">{p}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">None</Text>
          ),
      },
    ],
    [],
  )

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Module Builder"
        subtitle="Generate a new module with its CRUD scaffolding."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => dispatch(openAddDrawer())}
          >
            Create Module
          </Button>
        }
      />

      <Card styles={{ body: { padding: 18 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={modules}
          loading={isLoading}
          locale={{
            emptyText: isError
              ? 'Backend not connected yet — module generation API is pending.'
              : 'No modules generated yet.',
          }}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>

      <AddModuleDrawer />
    </Space>
  )
}

export default ModuleBuilderPage
