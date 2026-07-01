import {
  AppstoreAddOutlined,
  BarChartOutlined,
  BuildOutlined,
  FileTextOutlined,
  KeyOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { ReactNode } from 'react'
import { ICONS } from './iconRegistry'
import type { Module } from '../types/models'

type MenuItem = NonNullable<MenuProps['items']>[number]

/**
 * Single source of truth for the sidebar menu AND the header quick-search.
 * `menuItems` follows AntD <Menu> item shape (groups + children).
 * `searchableItems` is a flat list derived for the search popover.
 */
export const menuItems: MenuItem[] = [
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
      {
        key: '/module-builder',
        icon: <BuildOutlined />,
        label: 'Module Builder',
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
export const searchableItems: SearchableItem[] = menuItems.flatMap((group) => {
  if (!group || !('children' in group) || !group.children) return []
  return group.children.map((item) => {
    const it = item as { key?: string; label?: ReactNode; icon?: ReactNode }
    return { key: String(it.key), label: String(it.label), icon: it.icon }
  })
})

/**
 * Convert the DB module tree (from /modules/tree) into AntD <Menu> item shape.
 * Groups become menu groups, items become links, and items with children
 * become sub-menus. Icons are resolved from the string registry.
 */
export function buildMenuItems(tree: Module[] = []): MenuItem[] {
  const toItems = (nodes: Module[]): MenuItem[] =>
    nodes.map((node) => {
      const children = node.children?.length ? toItems(node.children) : null

      if (node.type === 'group') {
        return { type: 'group', label: node.name, children: children ?? [] }
      }

      const Icon = node.icon ? ICONS[node.icon] : undefined
      return {
        key: `/${node.slug}`,
        label: node.name,
        icon: Icon ? <Icon /> : undefined,
        ...(children ? { children } : {}),
      }
    })

  return toItems(tree)
}

export interface SearchableItem {
  key: string
  label: string
  icon?: ReactNode
}

/** Flatten a DB tree into the header search list (leaf items only). */
export function buildSearchableItems(tree: Module[] = []): SearchableItem[] {
  const out: SearchableItem[] = []
  const walk = (nodes: Module[]) =>
    nodes.forEach((node) => {
      if (node.type === 'item' && !node.children?.length) {
        const Icon = node.icon ? ICONS[node.icon] : undefined
        out.push({ key: `/${node.slug}`, label: node.name, icon: Icon ? <Icon /> : undefined })
      }
      if (node.children?.length) walk(node.children)
    })
  walk(tree)
  return out
}
