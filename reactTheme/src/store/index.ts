import { configureStore } from '@reduxjs/toolkit'
import apiClient from '../services/apiClient'
import { clearClientCaches } from '../utils/session'
import { centralOrigin } from '../utils/tenantUtils'
import authReducer, { clearCredentials } from './authSlice'
import uiReducer, { STORAGE_KEY, pickPersistedSettings } from './uiSlice'
import orgReducer, { ORG_STORAGE_KEY } from './orgSlice'
import usersReducer from '../modules/users/usersSlice'
import rolesReducer from '../modules/roles/rolesSlice'
import permissionsReducer from '../modules/permissions/permissionsSlice'
import moduleBuilderReducer from '../modules/module-builder/moduleBuilderSlice'
import applicationTypesReducer from '../modules/applicationtypes/applicationTypesSlice'
import countriesReducer from '../modules/countries/countriesSlice'
import citiesReducer from '../modules/cities/citiesSlice'
import gendersReducer from '../modules/genders/gendersSlice'
import globalSettingsReducer from '../modules/globalsettings/globalSettingsSlice'
import departmentsReducer from '../modules/departments/departmentsSlice'
import designationsReducer from '../modules/designations/designationsSlice'
import leaveTypesReducer from '../modules/leavetypes/leaveTypesSlice'
import documentTypesReducer from '../modules/documenttypes/documentTypesSlice'
import organizationsReducer from '../modules/organizations/organizationsSlice'
// __MODULE_REDUCER_IMPORTS__

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    org: orgReducer,
    users: usersReducer,
    roles: rolesReducer,
    permissions: permissionsReducer,
    moduleBuilder: moduleBuilderReducer,
    applicationTypes: applicationTypesReducer,
    countries: countriesReducer,
    cities: citiesReducer,
    genders: gendersReducer,
    globalSettings: globalSettingsReducer,
    departments: departmentsReducer,
    designations: designationsReducer,
    leaveTypes: leaveTypesReducer,
    documentTypes: documentTypesReducer,
    organizations: organizationsReducer,
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

// Persist the selected organization the same way, so the choice survives reloads.
let lastOrg = ''

store.subscribe(() => {
  const id = store.getState().org.currentOrganizationId
  const serialized = id === null ? '' : String(id)

  if (serialized !== lastOrg) {
    lastOrg = serialized

    try {
      if (id === null) localStorage.removeItem(ORG_STORAGE_KEY)
      else localStorage.setItem(ORG_STORAGE_KEY, serialized)
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
    // The tenant went away mid-session (deleted while someone was logged in);
    // TenantVerificationProvider only covers the check at load. The backend
    // can't answer with a 302 here — XHR would follow it and we'd read central's
    // 401 as an ordinary logged-out response — so it returns a 404 carrying the
    // central host and we navigate ourselves.
    const redirectHost = error?.response?.data?.data?.central_host

    if (
      error?.response?.status === 404 &&
      typeof redirectHost === 'string' &&
      redirectHost &&
      window.location.hostname !== redirectHost
    ) {
      clearClientCaches()
      window.location.replace(centralOrigin(redirectHost))

      // Leave the promise unsettled: navigation is underway and rejecting here
      // would flash an error toast on the page being torn down.
      return new Promise(() => {})
    }

    if (error?.response?.status === 401 && store.getState().auth.isAuthenticated) {
      store.dispatch(clearCredentials())
      clearClientCaches()
    }

    return Promise.reject(error)
  },
)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
