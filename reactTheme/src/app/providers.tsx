import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { queryClient } from '../services/queryClient'
import { store } from '../store'
import { ToastHost } from '../utils/toast'
import { useAppSelector } from '../store/hooks'

// Maps the `fontScale` UI setting onto a concrete AntD base font size.
const FONT_SIZE_BY_SCALE = { compact: 13, comfortable: 14, large: 16 }

// Bridges the Redux `ui` slice into AntD's ConfigProvider tokens and toggles the
// Tailwind `.dark` class on <html>, so the entire app re-themes from one place.
function ThemeProvider({ children }) {
  const settings = useAppSelector((state) => state.ui)
  const fontSize = FONT_SIZE_BY_SCALE[settings.fontScale] ?? 14

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      settings.themeMode === 'dark',
    )
  }, [settings.themeMode])

  return (
    <ConfigProvider
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

function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Provider>
  )
}

export default AppProviders
