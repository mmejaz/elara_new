import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useServerTable } from '../../../components/DataTable'
import AddCountryDrawer from '../components/AddCountryDrawer'
import EditCountryDrawer from '../components/EditCountryDrawer'
import { openAddDrawer, openEditDrawer } from '../countriesSlice'
import { useCountries, useDeleteCountry } from '../queries'
import { useAppDispatch } from '../../../store/hooks'
import { toast } from '../../../utils/toast'
import type { Country } from '../types'

const { Text } = Typography

function CountriesPage() {
  const dispatch = useAppDispatch()
  const table = useServerTable(15, 'Search Countries…')
  const { data, isLoading } = useCountries(table.params)
  const remove = useDeleteCountry()

  const handleDelete = (id: number) =>
    remove.mutate(id, {
      onSuccess: () => toast.success('Deleted'),
      onError: () => toast.error('Unable to delete'),
    })

  const columns = useMemo<ColumnsType<Country>>(
    () => [
      { title: 'Name', dataIndex: 'name', sorter: true, render: (name) => <Text strong>{name}</Text> },
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
        title="Countries"
        subtitle="Manage Countries records."
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(openAddDrawer())}>
              Add Country
            </Button>
          </Space>
        }
      />
      <DataTable<Country>
        columns={visibleColumns}
        dataSource={data?.data ?? []}
        loading={isLoading}
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
