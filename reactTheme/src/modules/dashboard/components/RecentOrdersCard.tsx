import { ShoppingCartOutlined } from '@ant-design/icons'
import { Card, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { recentOrders } from '../data'

const { Text } = Typography

const STATUS_COLORS: Record<string, string> = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'error',
}

// Compact table of recent orders — demonstrates the themed AntD Table + Tags.
function RecentOrdersCard() {
  const { t } = useTranslation()
  const columns = useMemo<ColumnsType<(typeof recentOrders)[number]>>(
    () => [
      { title: t('dashboard.col.order'), dataIndex: 'id', render: (id) => <Text strong>{id}</Text> },
      { title: t('dashboard.col.customer'), dataIndex: 'customer' },
      { title: t('dashboard.col.product'), dataIndex: 'product', responsive: ['md'] },
      {
        title: t('dashboard.col.amount'),
        dataIndex: 'amount',
        align: 'right',
        render: (amount) => `$${amount.toLocaleString()}`,
      },
      {
        title: t('dashboard.col.status'),
        dataIndex: 'status',
        render: (status) => (
          <Tag color={STATUS_COLORS[status]} className="!m-0">
            {t(`dashboard.orderStatus.${status}`)}
          </Tag>
        ),
      },
      {
        title: t('dashboard.col.date'),
        dataIndex: 'date',
        responsive: ['lg'],
        render: (date) => dayjs(date).format('MMM D, YYYY'),
      },
    ],
    [t],
  )

  return (
    <Card className="w-full" styles={{ body: { padding: 18 } }}>
      <div className="mb-4 flex items-center gap-2.5">
        <ShoppingCartOutlined />
        <Text strong className="!text-base">
          {t('dashboard.recentOrders')}
        </Text>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={recentOrders}
        pagination={false}
        size="small"
        scroll={{ x: true }}
      />
    </Card>
  )
}

export default RecentOrdersCard
