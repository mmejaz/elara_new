import { App } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type { NotificationInstance } from 'antd/es/notification/interface'
import type { ReactNode } from 'react'

/**
 * Centralized toaster for the whole app — success / error / warning / info /
 * loading. Wraps AntD's context-aware message API so it picks up the current
 * theme, and exposes a plain `toast` object that can be called from anywhere,
 * including outside React (e.g. TanStack Query callbacks, services).
 *
 * Usage:
 *   import { toast } from '@/utils/toast'
 *   toast.success('Saved')
 *   toast.error('Something went wrong')
 *
 * Setup (done once): mount <ToastHost /> inside AntD's <App> provider.
 */

let api: MessageInstance | null = null
let notifyApi: NotificationInstance | null = null

/**
 * Invisible bridge component. Mounted once inside <App>, it captures the
 * context-aware message + notification instances into module-level refs so
 * `toast` / `notify` can be used from anywhere. Renders nothing.
 */
export function ToastHost() {
  const { message, notification } = App.useApp()
  api = message
  notifyApi = notification
  return null
}

const notReady = (type: string, content: ReactNode) => {
  // Fired before <ToastHost/> mounts (shouldn't happen in normal flow).
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[toast] "${type}" called before ToastHost mounted:`, content)
  }
}

type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

const make =
  (type: MessageType) =>
  (content: ReactNode, options?: Record<string, unknown>) =>
    api ? api[type]({ content, ...options }) : notReady(type, content)

export const toast = {
  success: make('success'),
  error:   make('error'),
  warning: make('warning'),
  info:    make('info'),
  loading: make('loading'),
}

/**
 * Corner notifications (top-left by default) — larger, with an optional
 * description. Use for confirmations you want shown in the corner rather than
 * the centered lightweight `toast`.
 *
 *   notify.success('User created', 'The account is ready to use.')
 */
type NotifyType = 'success' | 'error' | 'warning' | 'info'

const makeNotify =
  (type: NotifyType) =>
  (message: ReactNode, description?: ReactNode, options?: Record<string, unknown>) =>
    notifyApi
      ? notifyApi[type]({ message, description, placement: 'topLeft', ...options })
      : notReady(type, message)

export const notify = {
  success: makeNotify('success'),
  error:   makeNotify('error'),
  warning: makeNotify('warning'),
  info:    makeNotify('info'),
}
