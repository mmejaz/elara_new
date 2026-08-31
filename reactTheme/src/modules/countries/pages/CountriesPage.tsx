import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddCountryDrawer from '../components/AddCountryDrawer'
import EditCountryDrawer from '../components/EditCountryDrawer'
import { openAddDrawer, openEditDrawer, closeAddDrawer, closeEditDrawer } from '../countriesSlice'
import { useCountries, useDeleteCountry } from '../queries'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import { useTranslation } from 'react-i18next'
import type { Country } from '../types'

const { Text } = Typography

function CountriesPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  // URL-backed table state + deep-linkable Add/Edit drawers (?add / ?edit=<id>),
  // mirroring the Users module — shareable and refresh-proof.
  const table = useUrlTable(15, t('pages.countries.search'))
  const drawer = useUrlDrawer()
  const addOpen = useAppSelector((state) => state.countries.addDrawerOpen)
  const editOpen = useAppSelector((state) => state.countries.editDrawerOpen)
  const editing = useAppSelector((state) => state.countries.editing)
  const { data, isFetching } = useCountries(table.params)
  const remove = useDeleteCountry()

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

  const columns = useMemo<ColumnsType<Country>>(
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
        title={t('pages.countries.title')}
        subtitle={t('pages.countries.subtitle')}
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => drawer.openAdd()}>
              {t('pages.countries.add')}
            </Button>
          </Space>
        }
      />
      <DataTable<Country>
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
      <AddCountryDrawer />
      <EditCountryDrawer />
    </Space>
  )
}

export default CountriesPage
