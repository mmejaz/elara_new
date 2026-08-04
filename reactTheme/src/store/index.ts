import { configureStore } from '@reduxjs/toolkit'
import apiClient from '../services/apiClient'
import { clearClientCaches } from '../utils/session'
import authReducer, { clearCredentials } from './authSlice'
import uiReducer, { STORAGE_KEY, pickPersistedSettings } from './uiSlice'
import usersReducer from '../modules/users/usersSlice'
import rolesReducer from '../modules/roles/rolesSlice'
import permissionsReducer from '../modules/permissions/permissionsSlice'
import moduleBuilderReducer from '../modules/module-builder/moduleBuilderSlice'
import applicationTypesReducer from '../modules/applicationtypes/applicationTypesSlice'
import countriesReducer from '../modules/countries/countriesSlice'
import citiesReducer from '../modules/cities/citiesSlice'
import gendersReducer from '../modules/genders/gendersSlice'
import globalSettingsReducer from '../modules/globalsettings/globalSettingsSlice'
// __MODULE_REDUCER_IMPORTS__

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    users: usersReducer,
    roles: rolesReducer,
    permissions: permissionsReducer,
    moduleBuilder: moduleBuilderReducer,
    applicationTypes: applicationTypesReducer,
    countries: countriesReducer,
    cities: citiesReducer,
    genders: gendersReducer,
    globalSettings: globalSettingsReducer,
    // __MODULE_REDUCERS__
  },
})

// Persist UI/theme settings to localStorage as a side effect of state changes,
// keeping the reducers pure. Only writes when the persisted subset actually
// changes, so unrelated dispatches don't touch disk.
let lastPersisted = ''

store.subscribe(() => {
  const serialized = JSON.stringify(pickPersistedSettings(store.getState().ui))

  if (serialized !== lastPersisted) {
    lastPersisted = serialized

    try {
      localStorage.setItem(STORAGE_KEY, serialized)
    } catch {
      // Ignore write failures (private mode, quota, etc.).
    }
  }
})

// Global response interceptor: when the server rejects the session (401) mid-use
// — expired or revoked cookie — flip auth off so AuthGuard redirects to /login,
// and drop cached user data. Guarded on isAuthenticated so the routine "not
// logged in yet" 401 from the initial /user probe doesn't churn state or wipe
// caches. Registered here (not in apiClient) to avoid a store↔apiClient cycle.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && store.getState().auth.isAuthenticated) {
      store.dispatch(clearCredentials())
      clearClientCaches()
    }

    return Promise.reject(error)
  },
)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
