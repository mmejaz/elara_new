import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Popconfirm, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import AddCityDrawer from '../components/AddCityDrawer'
import EditCityDrawer from '../components/EditCityDrawer'
import { openAddDrawer, openEditDrawer } from '../citiesSlice'
import { useCities, useDeleteCity } from '../queries'
import { useAppDispatch } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import type { City } from '../types'

const { Text } = Typography

function CitiesPage() {
  const dispatch = useAppDispatch()
  const { data: rows = [], isLoading } = useCities()
  const remove = useDeleteCity()

  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  const columns = useMemo<ColumnsType<City>>(
    () => [
      { title: 'Name', dataIndex: 'name', render: (name) => <Text strong>{name}</Text> },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => dispatch(openEditDrawer(record))} />
            </Tooltip>
            <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [dispatch],
  )

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Cities"
        subtitle="Manage Cities records."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
            Add City
          </Button>
        }
      />
      <Card styles={{ body: { padding: 18 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>
      <AddCityDrawer />
      <EditCityDrawer />
    </Space>
  )
}

export default CitiesPage
