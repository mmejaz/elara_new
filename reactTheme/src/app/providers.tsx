import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { App as AntApp, ConfigProvider, Spin, theme } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Provider } from 'react-redux'
import { queryClient } from '../services/queryClient'
import { store } from '../store'
import { ToastHost } from '../utils/toast'
import { useAppSelector } from '../store/hooks'
import { useTenantVerification } from '../hooks/useTenantVerification'
import { centralOrigin, isCentralHost } from '../utils/tenantUtils'
import { antdLocaleFor } from './antdLocale'

// Maps the `fontScale` UI setting onto a concrete AntD base font size.
const FONT_SIZE_BY_SCALE = { compact: 13, comfortable: 14, large: 16 }

// Bridges the Redux `ui` slice into AntD's ConfigProvider tokens and toggles the
// Tailwind `.dark` class on <html>, so the entire app re-themes from one place.
function ThemeProvider({ children }) {
  const settings = useAppSelector((state) => state.ui)
  const fontSize = FONT_SIZE_BY_SCALE[settings.fontScale] ?? 14
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      settings.themeMode === 'dark',
    )
  }, [settings.themeMode])

  // Keep the document language in sync for accessibility / correct hyphenation.
  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <ConfigProvider
      locale={antdLocaleFor(i18n.language)}
      theme={{
        algorithm: [
          settings.themeMode === 'dark'
            ? theme.darkAlgorithm
            : theme.defaultAlgorithm,
          ...(settings.compactMode ? [theme.compactAlgorithm] : []),
        ],
        token: {
          borderRadius: settings.borderRadius,
          colorPrimary: settings.primaryColor,
          fontFamily: settings.fontFamily,
          fontSize,
        },
      }}
    >
      <AntApp>
        <ToastHost />
        <div style={{ fontFamily: settings.fontFamily }}>{children}</div>
      </AntApp>
    </ConfigProvider>
  )
}

/**
 * Wraps the app to verify tenant exists (for non-central hosts).
 * STRICTLY blocks rendering until verification completes.
 * Non-existent or unreachable tenants are redirected to central domain.
 */
function TenantVerificationProvider({ children }) {
  const { status, isLoading, redirectHost } = useTenantVerification()
  const isCentral = isCentralHost()

  // For tenant subdomains, MUST verify before rendering anything
  if (!isCentral) {
    if (isLoading) {
      // Still verifying - show black screen with spinner, no app content
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#000',
          }}
        >
          <Spin size="large" />
        </div>
      )
    }

    if (status === 'not-found' || status === 'error') {
      // Tenant doesn't exist OR verification failed - redirect to central domain
      // This prevents non-existent/invalid tenants from ever showing login page
      // replace() rather than href so the dead subdomain doesn't sit in history
      // and send the user straight back here on Back.
      setTimeout(() => {
        window.location.replace(centralOrigin(redirectHost))
      }, 800)

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#000',
            color: '#fff',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>{status === 'not-found' ? 'Tenant not found' : 'Access denied'}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Redirecting to home...</div>
        </div>
      )
    }
  }

  // Only render children if:
  // 1. We're on central domain (no verification needed), OR
  // 2. Tenant verification succeeded (status === 'verified')
  return children
}

function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TenantVerificationProvider>{children}</TenantVerificationProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  )
}

export default AppProviders
