import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddGenderDrawer from '../components/AddGenderDrawer'
import EditGenderDrawer from '../components/EditGenderDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../gendersSlice'
import { useGenders, useDeleteGender } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import { useTranslation } from 'react-i18next'
import type { Gender } from '../types'

const { Text } = Typography

function GendersPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const table = useUrlTable(15, t('pages.genders.search'))
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.genders.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.genders.editDrawerOpen)
  const editing = useAppSelector((state) => state.genders.editing)
  const { data, isFetching } = useGenders(table.params)
  const remove = useDeleteGender()

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

  const columns = useMemo<ColumnsType<Gender>>(
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
        title={t('pages.genders.title')}
        subtitle={t('pages.genders.subtitle')}
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
              {t('pages.genders.add')}
            </Button>
          </Space>
        }
      />
      <DataTable<Gender>
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
      <AddGenderDrawer />
      <EditGenderDrawer />
    </Space>
  )
}

export default GendersPage
