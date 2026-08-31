import {
  AppstoreOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  DollarOutlined,
  FileTextOutlined,
  FundOutlined,
  LineChartOutlined,
  PercentageOutlined,
  PieChartOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

/** icon token (stored on the widget) → Ant Design icon element. */
export const WIDGET_ICONS: Record<string, ReactNode> = {
  dollar: <DollarOutlined />,
  cart: <ShoppingCartOutlined />,
  team: <TeamOutlined />,
  percent: <PercentageOutlined />,
  line: <LineChartOutlined />,
  list: <UnorderedListOutlined />,
  pie: <PieChartOutlined />,
  bar: <BarChartOutlined />,
  area: <AreaChartOutlined />,
  fund: <FundOutlined />,
  file: <FileTextOutlined />,
  calendar: <CalendarOutlined />,
  clock: <ClockCircleOutlined />,
  bell: <BellOutlined />,
  star: <StarOutlined />,
  appstore: <AppstoreOutlined />,
  cluster: <ClusterOutlined />,
}

/** Built-in widget key → default icon token (for legacy rows without an icon). */
const DEFAULT_BY_KEY: Record<string, string> = {
  revenue: 'dollar',
  orders: 'cart',
  customers: 'team',
  conversion: 'percent',
  monthly_revenue: 'line',
  recent_orders: 'list',
  traffic_by_channel: 'pie',
  tenants: 'cluster',
  modules: 'appstore',
}

export function widgetIcon(widget: { key: string; icon?: string | null }): ReactNode {
  const token = widget.icon || DEFAULT_BY_KEY[widget.key]
  return (token && WIDGET_ICONS[token]) || <AppstoreOutlined />
}

/** Built-in widget keys — these have a dedicated dashboard component and can't be deleted. */
export const BUILTIN_KEYS = Object.keys(DEFAULT_BY_KEY)
export const isBuiltinWidget = (key: string) => BUILTIN_KEYS.includes(key)

/** The tokens offered in the Add-widget icon picker. */
export const ICON_CHOICES = Object.keys(WIDGET_ICONS)
