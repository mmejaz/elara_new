import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { App as AntApp, ConfigProvider } from 'antd'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import authReducer from '../store/authSlice'
import uiReducer from '../store/uiSlice'
import usersReducer from '../modules/users/usersSlice'
import rolesReducer from '../modules/roles/rolesSlice'
import permissionsReducer from '../modules/permissions/permissionsSlice'
import moduleBuilderReducer from '../modules/module-builder/moduleBuilderSlice'
import { ToastHost } from '../utils/toast'
import type { RootState } from '../store'

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  roles: rolesReducer,
  permissions: permissionsReducer,
  moduleBuilder: moduleBuilderReducer,
})

/** Build a fresh store per test, optionally seeded with partial state. */
export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState })
}

export type TestStore = ReturnType<typeof makeStore>

interface Options extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  store?: TestStore
}

/** Render a component inside all app providers (Redux + Query + AntD). */
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = makeStore(preloadedState), ...options }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <AntApp>
              <ToastHost />
              {children}
            </AntApp>
          </ConfigProvider>
        </QueryClientProvider>
      </Provider>
    )
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) }
}

// Re-export everything from Testing Library so tests import from one place.
export * from '@testing-library/react'
