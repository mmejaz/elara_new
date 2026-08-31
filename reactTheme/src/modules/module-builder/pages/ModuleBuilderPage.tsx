import { PlusOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useUrlDrawer, useUrlTable } from '../../../components/DataTable'
import AddModuleDrawer from '../components/AddModuleDrawer'
import { openAddDrawer, closeAddDrawer } from '../moduleBuilderSlice'
import { useModulesPaginated } from '../../../hooks/useModules'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { useTranslation } from 'react-i18next'

const { Text } = Typography

function ModuleBuilderPage() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const table = useUrlTable(15, t('moduleBuilder.search'))
  // The Add drawer is deep-linkable via ?add=true (this page has no edit).
  const drawer = useUrlDrawer()
  const addDrawerOpen = useAppSelector((state) => state.moduleBuilder.addDrawerOpen)

  // The URL drives the drawer: ?add=true opens Add, no param closes it.
  useEffect(() => {
    if (drawer.add) {
      if (!addDrawerOpen) dispatch(openAddDrawer())
    } else if (addDrawerOpen) {
      dispatch(closeAddDrawer())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer.add])
  // isFetching (not isLoading): with keepPreviousData the query keeps showing the
  // previous page's rows on a page switch, so isLoading stays false. isFetching
  // is true for every in-flight request — initial load, pagination, search, sort
  // — so the table's loading overlay shows until the new page returns.
  const { data, isFetching } = useModulesPaginated(table.params)

  const columns = useMemo<ColumnsType<Record<string, unknown>>>(
    () => [
      {
        title: t('moduleBuilder.col.module'),
        dataIndex: 'name',
        sorter: true,
        render: (name) => <Text strong>{name}</Text>,
      },
      {
        title: t('moduleBuilder.col.type'),
        key: 'type',
        render: (_, record) => {
          if (record.type === 'group') return <Tag color="geekblue">{t('moduleBuilder.groupSection')}</Tag>
          return record.resourceful ? (
            <Tag color="green">{t('moduleBuilder.resourcefulCrud')}</Tag>
          ) : (
            <Tag color="gold">{t('moduleBuilder.parentMenu')}</Tag>
          )
        },
      },
      {
        title: t('moduleBuilder.col.parent'),
        dataIndex: 'parent',
        render: (parent) =>
          parent ? (
            <Text>{parent.startsWith('group:') ? parent.slice(6) : parent}</Text>
          ) : (
            <Text type="secondary">{t('moduleBuilder.topLevel')}</Text>
          ),
      },
      {
        title: t('moduleBuilder.col.permissions'),
        dataIndex: 'permissions',
        render: (permissions = []) =>
          permissions.length ? (
            <Space size={[4, 4]} wrap>
              {permissions.map((p) => (
                <Tag key={p} color="blue">{p}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary">{t('moduleBuilder.noPermissions')}</Text>
          ),
      },
    ],
    [t],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={t('moduleBuilder.title')}
        subtitle={t('moduleBuilder.subtitle')}
        titleExtra={control}
        extra={
          <Space>
            {table.searchInput}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => drawer.openAdd()}
            >
              {t('moduleBuilder.create')}
            </Button>
          </Space>
        }
      />

      <DataTable<Record<string, unknown>>
        columns={visibleColumns}
        dataSource={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isFetching}
        searchable={false}
        showColumnToggle={false}
        server={{
          total: data?.meta.total ?? 0,
          page: table.page,
          pageSize: table.pageSize,
          onChange: table.onChange,
        }}
      />

      <AddModuleDrawer />
    </Space>
  )
}

export default ModuleBuilderPage
