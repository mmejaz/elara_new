import {
  BellOutlined,
  CaretDownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Grid,
  Input,
  Layout,
  Tooltip,
  Typography,
} from 'antd'
import { Suspense, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import Preloader from '../components/Preloader'
import SettingsDrawer from '../components/SettingsDrawer'
import SidebarContent from '../components/SidebarContent'
import { searchableItems } from '../config/navigation'
import { logout } from '../store/authSlice'
import {
  openSettingsDrawer,
  setSidebarCollapsed,
  toggleSidebar,
} from '../store/uiSlice'
import { hexToRgba } from '../utils/color'

const { Header, Content, Sider } = Layout
const { Text } = Typography

// Static demo notifications shown in the header dropdown.
const notifications = [
  {
    id: 'welcome',
    title: 'Welcome to React Theme',
    description: 'Customize colors and layout from the settings drawer.',
    time: 'Now',
  },
  {
    id: 'users-module',
    title: 'Users module ready',
    description: 'The user table is scaffolded for API data.',
    time: '5 min ago',
  },
]

function AdminLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)
  const [isCollapseHovered, setIsCollapseHovered] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const screens = Grid.useBreakpoint()
  const user = useSelector((state) => state.auth.user)
  const settings = useSelector((state) => state.ui)
  const collapsed = settings.sidebarCollapsed
  const isDark = settings.themeMode === 'dark'
  const primaryColor = settings.primaryColor
  const colorBorderSecondary = isDark ? '#303030' : '#f0f0f0'
  const colorBgContainer = isDark ? '#141414' : '#ffffff'
  const headerHeight = settings.headerHeight

  // Below `lg` the fixed rail gives way to an off-canvas drawer + hamburger.
  const isMobile = !screens.lg

  // Resolve the current page's label for the header title (from the nav config).
  const currentPageLabel = useMemo(() => {
    const match = searchableItems.find((item) => item.key === location.pathname)
    return match?.label ?? ''
  }, [location.pathname])

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return searchableItems
    }

    return searchableItems.filter((item) =>
      item.label.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const actionButtonStyle = {
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    border: `1px solid ${colorBorderSecondary}`,
    background: colorBgContainer,
  }

  const accountItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      // Placeholder logout — clears the dummy user and routes to the login
      // placeholder. Replace with a real sign-out call when auth is added.
      onClick: async () => {
        await dispatch(logout())
        navigate('/login', { replace: true })
      },
    },
  ]

  const notificationItems = notifications.map((notification) => ({
    key: notification.id,
    label: (
      <div className="flex max-w-[280px] flex-col gap-1 px-1 py-1">
        <Text className="!font-semibold">{notification.title}</Text>
        <Text type="secondary" className="!text-xs">
          {notification.description}
        </Text>
        <Text type="secondary" className="!text-[11px]">
          {notification.time}
        </Text>
      </div>
    ),
  }))

  const selectSearchItem = (item) => {
    navigate(item.key)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  return (
    <Layout
      className="min-h-screen"
      style={{ background: isDark ? '#000000' : '#f5f5f5' }}
    >
      {/* Desktop: fixed collapsible rail. Hidden on mobile (drawer instead). */}
      {!isMobile && (
        <Sider
          className="shadow-[2px_0_8px_rgba(0,0,0,0.05)]"
          style={{
            background: colorBgContainer,
            borderRight: `1px solid ${colorBorderSecondary}`,
            overflow: 'hidden',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
          }}
          collapsed={collapsed}
          collapsedWidth={72}
          collapsible
          trigger={null}
          onCollapse={(value) => dispatch(setSidebarCollapsed(value))}
          theme={isDark ? 'dark' : 'light'}
          width={232}
        >
          <div className="h-full pb-12">
            <SidebarContent collapsed={collapsed} />
          </div>

          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            onMouseEnter={() => setIsCollapseHovered(true)}
            onMouseLeave={() => setIsCollapseHovered(false)}
            className="absolute bottom-0 flex h-12 w-full cursor-pointer items-center justify-center border-0 border-t bg-transparent text-base transition-colors"
            style={{
              background: isCollapseHovered ? primaryColor : colorBgContainer,
              borderTopColor: colorBorderSecondary,
              color: isCollapseHovered
                ? '#ffffff'
                : isDark
                  ? 'rgba(255,255,255,0.65)'
                  : 'rgba(0,0,0,0.65)',
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </Sider>
      )}

      {/* Mobile: off-canvas navigation drawer. */}
      <Drawer
        placement="left"
        open={isMobile && mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        size="default"
        closable={false}
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <Layout>
        <Header
          className={`z-10 border-b ${settings.stickyHeader ? 'sticky top-0' : ''}`}
          style={{
            height: headerHeight,
            lineHeight: `${headerHeight}px`,
            padding: '0 16px',
            background: colorBgContainer,
            borderBottomColor: colorBorderSecondary,
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="grid h-full min-h-14 w-full grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="relative flex min-w-0 items-center justify-start gap-2">
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                  style={{ ...actionButtonStyle, color: primaryColor }}
                />
              )}
              {!isSearchOpen ? (
                <Tooltip title="Search">
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    onClick={() => {
                      setIsSearchOpen(true)
                      setTimeout(() => searchInputRef.current?.focus?.(), 0)
                    }}
                    aria-label="Open search"
                    style={{ ...actionButtonStyle, color: primaryColor }}
                  />
                </Tooltip>
              ) : (
                <div className="relative w-[min(520px,calc(100vw-180px))] max-w-[520px]">
                  <Input.Search
                    ref={searchInputRef}
                    allowClear
                    autoFocus
                    placeholder="Search across modules and pages"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onSearch={() => {
                      if (searchSuggestions[0]) {
                        selectSearchItem(searchSuggestions[0])
                      }
                    }}
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearchOpen(false)
                      }
                    }}
                    size="large"
                    style={{
                      width: '100%',
                      borderRadius: 6,
                      fontSize: 13,
                      background: colorBgContainer,
                    }}
                  />

                  <div
                    className="slim-scroll absolute left-0 right-0 top-full z-[1000] mt-2 max-h-80 overflow-y-auto rounded-xl border bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.12)] dark:border-[#303030] dark:bg-[#141414] dark:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
                    style={{ borderColor: colorBorderSecondary }}
                  >
                    {searchSuggestions.length ? (
                      searchSuggestions.map((item, index) => (
                        <button
                          key={item.key}
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-3 py-2 text-left text-sm text-black/90 hover:bg-blue-50 dark:text-white/90 dark:hover:bg-white/5"
                          style={{
                            borderBottom:
                              index < searchSuggestions.length - 1
                                ? `1px solid ${colorBorderSecondary}`
                                : 'none',
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSearchItem(item)}
                        >
                          <span
                            className="grid size-7 shrink-0 place-items-center rounded-md"
                            style={{
                              background: hexToRgba(primaryColor, 0.08),
                              color: primaryColor,
                            }}
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-medium">
                            {item.label}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <Text type="secondary">No results found</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Center: current page title (hidden on small screens / while searching). */}
            <div className="hidden min-w-0 justify-center md:flex">
              {!isSearchOpen && currentPageLabel && (
                <Text strong className="!truncate !text-[15px]">
                  {currentPageLabel}
                </Text>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Dropdown
                menu={{
                  items: notificationItems,
                  style: { maxHeight: 320, overflowY: 'auto', padding: '4px 0' },
                }}
                trigger={['click']}
                placement="bottomRight"
                onOpenChange={(open) => {
                  if (open) {
                    setHasUnreadNotifications(false)
                  }
                }}
                popupRender={(menu) => (
                  <div
                    className="w-80 rounded-xl border bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.12)] dark:border-[#303030] dark:bg-[#141414] dark:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
                    style={{ borderColor: colorBorderSecondary }}
                  >
                    <div className="px-3 pb-1 pt-2">
                      <Text className="block !font-semibold">Notifications</Text>
                      <Text type="secondary" className="!text-xs">
                        You have {notifications.length} recent updates
                      </Text>
                    </div>
                    <Divider className="!my-2" />
                    {menu}
                  </div>
                )}
              >
                <Badge
                  count={hasUnreadNotifications ? notifications.length : 0}
                  size="small"
                  overflowCount={9}
                  offset={[-4, 4]}
                  style={{ backgroundColor: primaryColor }}
                >
                  <Button
                    type="text"
                    style={{
                      ...actionButtonStyle,
                      color: hasUnreadNotifications ? primaryColor : undefined,
                    }}
                    aria-label="Notifications"
                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                  />
                </Badge>
              </Dropdown>

              <Dropdown
                menu={{ items: accountItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <button
                  type="button"
                  className="flex h-9 cursor-pointer items-center gap-2.5 border px-2.5 py-0.5 sm:min-w-[182px]"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    borderColor: colorBorderSecondary,
                  }}
                >
                  <Avatar
                    size={32}
                    style={{
                      backgroundColor: primaryColor,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                    icon={!user?.name ? <UserOutlined /> : undefined}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : null}
                  </Avatar>
                  <span className="hidden min-w-0 flex-1 flex-col justify-center text-left sm:flex">
                    <Text className="!block !truncate !text-[13px] !font-semibold !leading-[1.25]">
                      {user?.name || 'User'}
                    </Text>
                    <Text
                      type="secondary"
                      className="!block !truncate !text-[11px] !leading-[1.25]"
                    >
                      {user?.email || 'Signed in'}
                    </Text>
                  </span>
                  <CaretDownOutlined className="hidden text-xs opacity-60 sm:inline" />
                </button>
              </Dropdown>
            </div>
          </div>
        </Header>

        <Content
          className="p-4"
          style={{ background: isDark ? '#000000' : '#f5f5f5' }}
        >
          <div
            className={
              settings.contentLayout === 'framed'
                ? 'mx-auto max-w-7xl rounded-xl bg-white p-6 shadow-sm dark:bg-[#141414]'
                : ''
            }
          >
            {/* resetKey clears a caught error when the user navigates away. */}
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<Preloader />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </Content>
      </Layout>

      <button
        type="button"
        aria-label="Theme settings"
        onClick={() => dispatch(openSettingsDrawer())}
        className="fixed right-0 top-1/2 z-[1000] flex h-[52px] w-[52px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-l-3xl border-0 text-[22px] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] brightness-100 transition hover:brightness-95"
        style={{ background: primaryColor }}
      >
        <SettingOutlined className="!text-white" />
      </button>

      <SettingsDrawer />
    </Layout>
  )
}

export default AdminLayout
