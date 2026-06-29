import { ShoppingCartOutlined } from '@ant-design/icons'
import { Card, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { recentOrders } from '../data'

const { Text } = Typography

const STATUS_COLORS = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'error',
}

// Compact table of recent orders — demonstrates the themed AntD Table + Tags.
function RecentOrdersCard() {
  const columns = useMemo(
    () => [
      { title: 'Order', dataIndex: 'id', render: (id) => <Text strong>{id}</Text> },
      { title: 'Customer', dataIndex: 'customer' },
      { title: 'Product', dataIndex: 'product', responsive: ['md'] },
      {
        title: 'Amount',
        dataIndex: 'amount',
        align: 'right',
        render: (amount) => `$${amount.toLocaleString()}`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (status) => (
          <Tag color={STATUS_COLORS[status]} className="!m-0">
            {status}
          </Tag>
        ),
      },
      {
        title: 'Date',
        dataIndex: 'date',
        responsive: ['lg'],
        render: (date) => dayjs(date).format('MMM D, YYYY'),
      },
    ],
    [],
  )

  return (
    <Card className="w-full" styles={{ body: { padding: 18 } }}>
      <div className="mb-4 flex items-center gap-2.5">
        <ShoppingCartOutlined />
        <Text strong className="!text-base">
          Recent Orders
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
