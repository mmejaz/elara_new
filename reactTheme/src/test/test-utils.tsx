import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
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
import gendersReducer from '../modules/genders/gendersSlice'
import { ToastHost } from '../utils/toast'
import type { RootState } from '../store'

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  roles: rolesReducer,
  permissions: permissionsReducer,
  moduleBuilder: moduleBuilderReducer,
  genders: gendersReducer,
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

  // Many components use router-aware hooks (useUrlTable/useUrlDrawer →
  // useSearch/useNavigate), which require a TanStack Router context. Render the
  // component as a single memory-history route so those hooks resolve in tests.
  function Providers({ children }: { children: ReactNode }) {
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

  const rootRoute = createRootRoute({
    component: () => <Providers>{ui}</Providers>,
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return {
    store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only router type
    ...render(<RouterProvider router={router as any} />, options),
  }
}

// Re-export everything from Testing Library so tests import from one place.
export * from '@testing-library/react'
