import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddApplicationTypeDrawer from '../components/AddApplicationTypeDrawer'
import EditApplicationTypeDrawer from '../components/EditApplicationTypeDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../applicationTypesSlice'
import { useApplicationTypes, useDeleteApplicationType } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import { useTranslation } from 'react-i18next'
import type { ApplicationType } from '../types'

const { Text } = Typography

function ApplicationTypesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  // URL-backed table state + deep-linkable Add/Edit drawers (?add / ?edit=<id>),
  // mirroring the Users module — shareable and refresh-proof.
  const table = useUrlTable(15, t('pages.applicationtypes.search'))
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.applicationTypes.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.applicationTypes.editDrawerOpen)
  const editing = useAppSelector((state) => state.applicationTypes.editing)
  const { data, isFetching } = useApplicationTypes(table.params)
  const remove = useDeleteApplicationType()

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
      onSuccess: () => toast.success(t('common.deleted')),
      onError: () => toast.error(t('common.unableToDelete')),
    })

  const columns = useMemo<ColumnsType<ApplicationType>>(
    () => [
      { title: t('common.name'), dataIndex: 'name', sorter: true, render: (name) => <Text strong>{name}</Text> },
      {
        title: t('common.actions'),
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} onClick={() => drawer.openEdit(record.id)} />
            </Tooltip>
            <Popconfirm title={t('common.deleteRecordConfirm')} onConfirm={() => handleDelete(record.id)}>
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
        title={t('pages.applicationtypes.title')}
        subtitle={t('pages.applicationtypes.subtitle')}
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
              {t('pages.applicationtypes.add')}
            </Button>
          </Space>
        }
      />
      <DataTable<ApplicationType>
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
      <AddApplicationTypeDrawer />
      <EditApplicationTypeDrawer />
    </Space>
  )
}

export default ApplicationTypesPage
