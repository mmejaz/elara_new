import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddDocumentTypeDrawer from '../components/AddDocumentTypeDrawer'
import EditDocumentTypeDrawer from '../components/EditDocumentTypeDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../documentTypesSlice'
import { useDocumentTypes, useDeleteDocumentType } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import type { DocumentType } from '../types'

const { Text } = Typography

function DocumentTypesPage() {
  const dispatch = useAppDispatch()
  const table = useUrlTable(15, 'Search Document Types…')
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.documentTypes.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.documentTypes.editDrawerOpen)
  const editing = useAppSelector((state) => state.documentTypes.editing)
  // isFetching (not isLoading): keepPreviousData keeps the previous page's
  // rows during a page switch, so isLoading stays false. isFetching is true
  // for every in-flight request, so the table shows its loading overlay on
  // pagination, search and sort until the new data returns.
  const { data, isFetching } = useDocumentTypes(table.params)
  const remove = useDeleteDocumentType()

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

  const columns = useMemo<ColumnsType<DocumentType>>(
    () => [
      { title: 'Name', dataIndex: 'name', sorter: true, render: (name) => <Text strong>{name}</Text> },
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
    [dispatch],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title="Document Types"
        subtitle="Manage Document Types records."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
              Add Document Type
            </Button>
          </Space>
        }
      />
      <DataTable<DocumentType>
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
      <AddDocumentTypeDrawer />
      <EditDocumentTypeDrawer />
    </Space>
  )
}

export default DocumentTypesPage
