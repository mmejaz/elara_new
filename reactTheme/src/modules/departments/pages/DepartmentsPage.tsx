import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import AddDepartmentDrawer from '../components/AddDepartmentDrawer'
import EditDepartmentDrawer from '../components/EditDepartmentDrawer'
import { openAddDrawer, openEditDrawer } from '../departmentsSlice'
import { useDepartments, useDeleteDepartment } from '../queries'
import { useAppDispatch } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import type { Department } from '../types'

const { Text } = Typography

function DepartmentsPage() {
  const dispatch = useAppDispatch()
  const table = useServerTable(15, 'Search Departments…')
  // isFetching (not isLoading): keepPreviousData keeps the previous page's
  // rows during a page switch, so isLoading stays false. isFetching is true
  // for every in-flight request, so the table shows its loading overlay on
  // pagination, search and sort until the new data returns.
  const { data, isFetching } = useDepartments(table.params)
  const remove = useDeleteDepartment()

  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  const columns = useMemo<ColumnsType<Department>>(
    () => [
      { title: 'Name', dataIndex: 'name', sorter: true, render: (name) => <Text strong>{name}</Text> },
      {
        title: 'Parent Department',
        dataIndex: ['parent', 'name'],
        render: (_, record) =>
          record.parent ? (
            <Text>{record.parent.name}</Text>
          ) : (
            <Tag color="default">Top level</Tag>
          ),
      },
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

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Departments"
        subtitle="Manage Departments records."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
              Add Department
            </Button>
          </Space>
        }
      />
      <DataTable<Department>
        columns={visibleColumns}
        dataSource={data?.data ?? []}
        loading={isFetching}
        showColumnToggle={false}
        searchable={false}
        server={{
          total: data?.meta.total ?? 0,
          page: table.page,
          pageSize: table.pageSize,
          onChange: table.onChange,
        }}
      />
      <AddDepartmentDrawer />
      <EditDepartmentDrawer />
    </Space>
  )
}

export default DepartmentsPage
