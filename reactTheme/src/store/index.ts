import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import uiReducer, { STORAGE_KEY, pickPersistedSettings } from './uiSlice'
import usersReducer from '../modules/users/usersSlice'
import rolesReducer from '../modules/roles/rolesSlice'
import permissionsReducer from '../modules/permissions/permissionsSlice'
import moduleBuilderReducer from '../modules/module-builder/moduleBuilderSlice'
import applicationTypesReducer from '../modules/applicationtypes/applicationTypesSlice'
import countriesReducer from '../modules/countries/countriesSlice'
import citiesReducer from '../modules/cities/citiesSlice'
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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
