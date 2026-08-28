import { ApartmentOutlined, AppstoreOutlined, CaretDownOutlined, CheckOutlined } from '@ant-design/icons'
import { Dropdown, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrganizationOptions } from '../modules/organizations/queries'
import { setCurrentOrganization } from '../store/orgSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { hexToRgba } from '../utils/color'

const { Text } = Typography

/**
 * Organization context switcher for the header — sits to the left of the search
 * bar. Opens a dropdown of organization "cards"; picking one sets the active
 * organization (persisted), or "All organizations" clears it.
 */
function OrganizationSwitcher() {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const currentId = useAppSelector((state) => state.org.currentOrganizationId)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const isSuperAdmin = useAppSelector((state) => state.auth.roles.includes('Super Admin'))
  // The switcher reads the org list from the admin `/organizations` endpoint,
  // which is gated by `organization.view`. A user without it (e.g. a role scoped
  // to a single module) can't call it — fetching anyway 403s. Gate on the same
  // permission: skip the request and hide the control for those users.
  const canViewOrgs = useAppSelector(
    (state) =>
      state.auth.roles.includes('Super Admin') ||
      state.auth.permissions.includes('organization.view'),
  )
  const primaryColor = useAppSelector((state) => state.ui.primaryColor)
  const isDark = useAppSelector((state) => state.ui.themeMode === 'dark')
  const [open, setOpen] = useState(false)

  const { data: organizations = [], isLoading } = useOrganizationOptions(canViewOrgs)

  // Default the active organization to the signed-in user's assigned org. This
  // matters most for impersonation: when you view the app AS another user, the
  // persisted org context belongs to the previous account, so reset it to the
  // impersonated user's own org. Runs once per user (tracked by id), after their
  // orgs have loaded, and only when the current selection isn't valid for them —
  // so a manual choice afterward is never overridden.
  const appliedForUser = useRef<number | null>(null)
  useEffect(() => {
    if (isLoading || userId == null) return
    if (appliedForUser.current === userId) return
    appliedForUser.current = userId

    const stillValid = currentId != null && organizations.some((o) => o.id === currentId)
    if (stillValid) return

    // Regular users are scoped to their assigned orgs → default to the first.
    // Super Admins see everything → default to "All organizations" (null).
    const next = !isSuperAdmin && organizations.length > 0 ? organizations[0].id : null
    if (next !== currentId) dispatch(setCurrentOrganization(next))
  }, [userId, isLoading, organizations, currentId, isSuperAdmin, dispatch])

  const current = useMemo(
    () => organizations.find((o) => o.id === currentId) ?? null,
    [organizations, currentId],
  )

  // Nothing to switch and no permission to load orgs → don't render the control.
  if (!canViewOrgs) return null

  const border = isDark ? '#303030' : '#f0f0f0'
  const bg = isDark ? '#141414' : '#ffffff'

  const select = (id: number | null) => {
    dispatch(setCurrentOrganization(id))
    setOpen(false)
  }

  const card = (opts: {
    key?: React.Key
    active: boolean
    icon: React.ReactNode
    title: string
    subtitle: string
    onClick: () => void
  }) => (
    <button
      key={opts.key}
      type="button"
      onClick={opts.onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-transparent px-2.5 py-2 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
      style={{ borderColor: opts.active ? primaryColor : border }}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-md text-base"
        style={{ background: hexToRgba(primaryColor, 0.1), color: primaryColor }}
      >
        {opts.icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Text className="!truncate !text-[13px] !font-semibold !leading-tight">{opts.title}</Text>
        <Text type="secondary" className="!truncate !text-[11px] !leading-tight">{opts.subtitle}</Text>
      </span>
      {opts.active && <CheckOutlined style={{ color: primaryColor, fontSize: 13 }} />}
    </button>
  )

  const popup = (
    <div
      className="w-[300px] rounded-xl border p-2 shadow-[0_6px_18px_rgba(15,23,42,0.12)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
      style={{ borderColor: border, background: bg }}
    >
      <div className="flex items-center justify-between px-2 pb-1 pt-1">
        <Text className="!text-xs !font-semibold uppercase tracking-wide" type="secondary">{t('orgSwitcher.title')}</Text>
        {organizations.length > 0 && (
          <Text type="secondary" className="!text-[11px]">{t('orgSwitcher.total', { count: organizations.length })}</Text>
        )}
      </div>

      <div className="mt-1 flex max-h-[340px] flex-col gap-1.5 overflow-y-auto pr-0.5">
        {card({
          active: currentId === null,
          icon: <AppstoreOutlined />,
          title: t('orgSwitcher.all'),
          subtitle: t('orgSwitcher.noFilter'),
          onClick: () => select(null),
        })}

        {isLoading && <Text type="secondary" className="!px-2 !py-3 !text-center !text-xs">{t('common.loading')}</Text>}

        {!isLoading && organizations.length === 0 && (
          <Text type="secondary" className="!px-2 !py-3 !text-center !text-xs">{t('orgSwitcher.empty')}</Text>
        )}

        {organizations.map((o) =>
          card({
            key: o.id,
            active: o.id === currentId,
            icon: <ApartmentOutlined />,
            title: o.name,
            subtitle: o.parent ? t('orgSwitcher.under', { name: o.parent.name }) : t('orgSwitcher.topLevel'),
            onClick: () => select(o.id),
          }),
        )}
      </div>
    </div>
  )

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      placement="bottomLeft"
      popupRender={() => popup}
    >
      <button
        type="button"
        className="flex h-9 cursor-pointer items-center gap-2 border px-2.5 text-left"
        style={{ background: bg, borderColor: border }}
        aria-label="Switch organization"
      >
        <ApartmentOutlined style={{ color: primaryColor, fontSize: 16 }} />
        <span className="hidden max-w-[130px] flex-col leading-tight sm:flex">
          <Text type="secondary" className="!text-[10px] !leading-tight">{t('orgSwitcher.title')}</Text>
          <Text className="!truncate !text-[13px] !font-semibold !leading-tight">
            {current ? current.name : t('orgSwitcher.all')}
          </Text>
        </span>
        <CaretDownOutlined className="text-[11px] opacity-60" />
      </button>
    </Dropdown>
  )
}

export default OrganizationSwitcher
