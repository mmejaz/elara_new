import {
  AppstoreAddOutlined,
  BarChartOutlined,
  FileTextOutlined,
  KeyOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'

/**
 * Single source of truth for the sidebar menu AND the header quick-search.
 * `menuItems` follows AntD <Menu> item shape (groups + children).
 * `searchableItems` is a flat list derived for the search popover.
 */
export const menuItems = [
  {
    type: 'group',
    label: 'Overview',
    children: [
      { key: '/dashboard', icon: <BarChartOutlined />, label: 'Dashboard' },
      {
        key: '/analytics',
        icon: <PieChartOutlined />,
        label: 'Analytics',
      },
      {
        key: '/attendance',
        icon: <OrderedListOutlined />,
        label: 'Attendance',
      },
    ],
  },
  {
    type: 'group',
    label: 'Management',
    children: [
      { key: '/users', icon: <TeamOutlined />, label: 'Users' },
      { key: '/roles', icon: <SafetyCertificateOutlined />, label: 'Roles' },
      { key: '/permissions', icon: <KeyOutlined />, label: 'Permissions' },
      {
        key: '/modules',
        icon: <AppstoreAddOutlined />,
        label: 'Managed Modules',
      },
    ],
  },
  {
    type: 'group',
    label: 'Account',
    children: [
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
      { key: '/reports', icon: <FileTextOutlined />, label: 'Reports' },
    ],
  },
]

// Flatten the grouped menu into the search list (skip group headers).
export const searchableItems = menuItems.flatMap((group) =>
  (group.children ?? []).map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
  })),
)
