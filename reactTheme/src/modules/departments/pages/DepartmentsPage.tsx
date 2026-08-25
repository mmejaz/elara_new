import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddDepartmentDrawer from '../components/AddDepartmentDrawer'
import EditDepartmentDrawer from '../components/EditDepartmentDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../departmentsSlice'
import { useDepartments, useDeleteDepartment } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import type { Department } from '../types'

const { Text } = Typography

function DepartmentsPage() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.auth.departmentMode)
  // URL-backed table state + deep-linkable Add/Edit drawers (?add / ?edit=<id>),
  // mirroring the Users module — shareable and refresh-proof.
  const table = useUrlTable(15, 'Search Departments…')
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.departments.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.departments.editDrawerOpen)
  const editing = useAppSelector((state) => state.departments.editing)
  // isFetching (not isLoading): keepPreviousData keeps the previous page's
  // rows during a page switch, so isLoading stays false. isFetching is true
  // for every in-flight request, so the table shows its loading overlay on
  // pagination, search and sort until the new data returns.
  const { data, isFetching } = useDepartments(table.params)
  const remove = useDeleteDepartment()

  // The URL drives the drawers: ?add opens Add; ?edit=<id> opens Edit for the
  // matching row on the current page; no param closes both.
  useEffect(() => {
    if (drawer.add) {
      if (!addOpen) dispatch(openAddDrawer())
    } else if (drawer.editId != null) {
      const match = (data?.data ?? []).find((r) => r.id === drawer.editId)
      if (match && editing?.id !== match.id) dispatch(openEditDrawer(match))
    } else {
      if (addOpen) dispatch(closeAddDrawer())
      if (editOpen) dispatch(closeEditDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add, drawer.editId, data])

  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  const columns = useMemo<ColumnsType<Department>>(
    () => [
      { title: 'Name', dataIndex: 'name', sorter: true, render: (name) => <Text strong>{name}</Text> },
      // Only meaningful when departments can belong to an organization. In
      // shared mode every department is tenant-wide, so the column is hidden.
      ...(mode !== 'shared' ? [{
        title: 'Organization',
        dataIndex: ['organization', 'name'],
        render: (_: unknown, record: Department) =>
          record.organization ? <Text>{record.organization.name}</Text> : <Tag color="cyan">Shared</Tag>,
      }] : []),
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
              <Button type="text" icon={<EditOutlined />} onClick={() => drawer.openEdit(record.id)} />
            </Tooltip>
            <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [dispatch, mode],
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
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
