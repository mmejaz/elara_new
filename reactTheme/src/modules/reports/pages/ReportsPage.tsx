import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../../components/PageHeader'
import DataTable, { useColumnToggle, useTableSearch } from '../../../components/DataTable'

const { Text } = Typography

interface Report {
  key: string
  name: string
  period: string
}

const reports: Report[] = [
  { key: 'sales', name: 'Sales Summary', period: 'Monthly' },
  { key: 'users', name: 'User Activity', period: 'Weekly' },
  { key: 'finance', name: 'Finance Statement', period: 'Quarterly' },
]

function ReportsPage() {
  const { t } = useTranslation()
  // Static local list, so search filters client-side.
  const { value: search, input: searchInput } = useTableSearch(t('reports.searchPlaceholder'))

  const columns = useMemo<ColumnsType<Report>>(
    () => [
      {
        title: t('reports.col.report'),
        dataIndex: 'name',
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (name) => (
          <Space>
            <FileTextOutlined />
            <Text strong>{name}</Text>
          </Space>
        ),
      },
      {
        title: t('reports.col.period'),
        dataIndex: 'period',
        render: (period) => <Tag color="blue">{t(`reports.period.${period}`)}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        width: 120,
        render: () => (
          <Tooltip title={t('reports.download')}>
            <Button type="text" icon={<DownloadOutlined />} aria-label={t('reports.download')} />
          </Tooltip>
        ),
      },
    ],
    [t],
  )

  const { visibleColumns, control } = useColumnToggle(columns)

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        titleExtra={control}
        extra={searchInput}
      />

      <DataTable<Report>
        columns={visibleColumns}
        dataSource={reports}
        rowKey="key"
        searchable={false}
        searchValue={search}
        showColumnToggle={false}
        searchKeys={['name', 'period']}
      />
    </Space>
  )
}

export default ReportsPage
