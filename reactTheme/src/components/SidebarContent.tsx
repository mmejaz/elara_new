import { ConfigProvider, Menu } from 'antd'
import { slimScroll } from '../styles/scrollbar'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { buildMenuItems, menuItems as staticMenuItems } from '../config/navigation'
import { useModuleTree } from '../hooks/useModuleTree'
import { hexToRgba } from '../utils/color'
import { useAppSelector } from '../store/hooks'

/**
 * The brand header + themed navigation menu. Shared between the desktop <Sider>
 * and the mobile off-canvas <Drawer> so both stay perfectly in sync.
 *
 * @param collapsed   render the rail in icon-only mode (desktop collapse)
 * @param onNavigate  called after a menu click (used to close the mobile drawer)
 */
interface SidebarContentProps {
  collapsed?: boolean
  onNavigate?: () => void
}

function SidebarContent({ collapsed = false, onNavigate }: SidebarContentProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { data: tree } = useModuleTree()

  // Render from the DB-driven module tree; fall back to the static config
  // while the tree is loading or if the request fails. Labels are localized by
  // module slug (nav.<slug>), falling back to the DB name when untranslated.
  const items = useMemo(
    () =>
      tree?.length
        ? buildMenuItems(tree, (slug, name) => t(`nav.${slug}`, { defaultValue: name }))
        : staticMenuItems,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-translate on language switch
    [tree, i18n.language],
  )

  const settings = useAppSelector((state) => state.ui)
  const isDark = settings.themeMode === 'dark'
  const primaryColor = settings.primaryColor

  const colorBorderSecondary = isDark ? '#303030' : '#f0f0f0'
  const colorBgContainer = isDark ? '#141414' : '#ffffff'
  const menuHoverBg = isDark
    ? hexToRgba(primaryColor, 0.2)
    : hexToRgba(primaryColor, 0.12)
  const menuSelectedBg = isDark
    ? hexToRgba(primaryColor, 0.28)
    : hexToRgba(primaryColor, 0.15)
  const menuItemColor = isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.72)'
  const menuGroupTitleColor = isDark
    ? 'rgba(255,255,255,0.48)'
    : 'rgba(0,0,0,0.45)'
  const selectedKey =
    location.pathname === '/' ? '/dashboard' : location.pathname

  const handleClick = ({ key }) => {
    navigate({ to: key })
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex w-full shrink-0 items-center justify-center border-b"
        style={{
          borderBottomColor: colorBorderSecondary,
          height: settings.headerHeight,
        }}
      >
        <span
          style={{
            color: primaryColor,
            fontSize: collapsed ? 17 : 22,
            fontWeight: 700,
            letterSpacing: 0.5,
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          {collapsed ? 'E' : 'Elara 360'}
        </span>
      </div>

      <div className={`${slimScroll} min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2`}>
        <div className="w-full px-2">
          <ConfigProvider
            theme={{
              token: { colorPrimary: primaryColor },
              components: {
                Menu: {
                  itemBg: colorBgContainer,
                  itemColor: menuItemColor,
                  itemSelectedBg: menuSelectedBg,
                  itemSelectedColor: isDark ? '#ffffff' : primaryColor,
                  itemHoverBg: menuHoverBg,
                  itemHoverColor: isDark ? '#ffffff' : primaryColor,
                  itemActiveBg: hexToRgba(primaryColor, 0.2),
                  groupTitleColor: menuGroupTitleColor,
                  // Expanded sub-menu background — default is a navy in dark mode;
                  // match the sidebar background so there's no blue tint.
                  subMenuItemBg: colorBgContainer,
                  darkItemBg: colorBgContainer,
                  darkSubMenuItemBg: colorBgContainer,
                  darkItemColor: menuItemColor,
                  darkItemHoverBg: menuHoverBg,
                  darkItemHoverColor: '#ffffff',
                  darkItemSelectedBg: menuSelectedBg,
                  darkItemSelectedColor: '#ffffff',
                  darkGroupTitleColor: menuGroupTitleColor,
                  borderRadius: settings.borderRadius,
                  itemBorderRadius: settings.borderRadius,
                },
              },
            }}
          >
            <Menu
              mode="inline"
              items={items}
              selectedKeys={[selectedKey]}
              onClick={handleClick}
              inlineCollapsed={collapsed}
              theme={isDark ? 'dark' : 'light'}
              style={{
                background: colorBgContainer,
                border: 'none',
                borderRadius: settings.borderRadius,
                overflow: 'hidden',
              }}
            />
          </ConfigProvider>
        </div>
      </div>
    </div>
  )
}

export default SidebarContent
