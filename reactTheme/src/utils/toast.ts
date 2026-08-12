import { App } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type {
  NotificationInstance,
  NotificationPlacement,
} from 'antd/es/notification/interface'
import type { ReactNode } from 'react'

/**
 * Single, object-driven toaster for the whole app. Supply ONE object and it
 * decides how to render:
 *
 *   import { toast } from '@/utils/toast'
 *
 *   toast({ type: 'success', message: 'Saved' })
 *   // → centered lightweight message
 *
 *   toast({ type: 'success', message: 'User created', description: 'Account is ready.' })
 *   // → top-right notification (a description was supplied, so the richer surface is auto-picked)
 *
 *   toast('Copied to clipboard')            // string shorthand → info message
 *   toast.error(serverMessage(err))         // typed shorthands still work
 *
 * Surface selection (the "auto show accordingly" part):
 *   - `surface: 'notification'`            → always the corner notification
 *   - `surface: 'message'`                 → always the centered message
 *   - `surface: 'auto'` (default)          → notification if `description` is set, else message
 *
 * Setup (once): mount <ToastHost/> inside AntD's <App> provider (see providers.tsx).
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastConfig {
  /** Visual style / icon. Defaults to 'info'. ('loading' only applies to messages.) */
  type?: ToastType
  /** Main line of text. */
  message: ReactNode
  /** Optional detail. When set (and surface is 'auto'), the corner notification is used. */
  description?: ReactNode
  /** Force a surface. 'auto' (default) picks by whether a description is present. */
  surface?: 'auto' | 'message' | 'notification'
  /** Seconds before auto-dismiss (AntD default if omitted). */
  duration?: number
  /** Corner placement for notifications. Default 'topRight'. */
  placement?: NotificationPlacement
  /** Stable key to replace/dedupe an existing toast. */
  key?: string
}

// Context-aware AntD instances, captured once by <ToastHost/> so `toast` can be
// called from anywhere — including outside React (services, query callbacks).
let messageApi: MessageInstance | null = null
let notifyApi: NotificationInstance | null = null

/**
 * Invisible bridge. Mounted once inside <App>, it captures the theme/context-aware
 * message + notification instances. Renders nothing.
 */
export function ToastHost() {
  const { message, notification } = App.useApp()
  messageApi = message
  notifyApi = notification
  return null
}

function warnNotReady(config: ToastConfig): void {
  // Fired before <ToastHost/> mounts (shouldn't happen in normal flow).
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn('[toast] called before ToastHost mounted:', config)
  }
}

/** The single renderer. Everything else is sugar that builds a ToastConfig. */
function show(config: ToastConfig): void {
  const {
    type = 'info',
    message,
    description,
    surface = 'auto',
    duration,
    placement,
    key,
  } = config

  const asNotification =
    surface === 'notification' || (surface === 'auto' && description != null)

  if (asNotification) {
    if (!notifyApi) return warnNotReady(config)
    // notification has no 'loading' variant — fall back to 'info'.
    const nType = type === 'loading' ? 'info' : type
    notifyApi[nType]({
      message,
      description,
      placement: placement ?? 'topRight',
      duration,
      key,
    })
    return
  }

  if (!messageApi) return warnNotReady(config)
  messageApi[type]({ content: message, duration, key })
}

/** Accept either a full config object or a bare string (with an optional forced type). */
function normalize(input: ToastConfig | string, type?: ToastType): ToastConfig {
  if (typeof input === 'string') {
    return { type: type ?? 'info', message: input }
  }
  return type ? { ...input, type } : input
}

type ToastInput = ToastConfig | string

interface ToastApi {
  (input: ToastInput): void
  success: (input: ToastInput) => void
  error: (input: ToastInput) => void
  warning: (input: ToastInput) => void
  info: (input: ToastInput) => void
  loading: (input: ToastInput) => void
}

/**
 * The one entry point. Call it with an object (recommended) or a string, or use
 * the typed shorthands `toast.success(...)` / `toast.error(...)`.
 */
export const toast = ((input: ToastInput) => show(normalize(input))) as ToastApi
toast.success = (input) => show(normalize(input, 'success'))
toast.error = (input) => show(normalize(input, 'error'))
toast.warning = (input) => show(normalize(input, 'warning'))
toast.info = (input) => show(normalize(input, 'info'))
toast.loading = (input) => show(normalize(input, 'loading'))

/**
 * Backward-compatible corner-notification helper. Routes through the same core,
 * forcing the notification surface. Prefer `toast({ ..., description })` in new
 * code — this exists so existing `notify.success(msg, desc)` call sites keep
 * working while everything shares one implementation.
 */
type NotifyType = 'success' | 'error' | 'warning' | 'info'

const makeNotify =
  (type: NotifyType) =>
  (message: ReactNode, description?: ReactNode, options?: Partial<ToastConfig>) =>
    show({ type, message, description, surface: 'notification', ...options })

export const notify = {
  success: makeNotify('success'),
  error: makeNotify('error'),
  warning: makeNotify('warning'),
  info: makeNotify('info'),
}
