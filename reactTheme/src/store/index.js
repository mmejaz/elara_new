import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import uiReducer, { STORAGE_KEY, pickPersistedSettings } from './uiSlice'
import usersReducer from './usersSlice'
import rolesReducer from './rolesSlice'
import permissionsReducer from './permissionsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    users: usersReducer,
    roles: rolesReducer,
    permissions: permissionsReducer,
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
