import { createSlice } from '@reduxjs/toolkit'

// Preset brand colors offered in the Settings drawer.
export const PRIMARY_PRESETS = {
  blue: '#1677ff',
  orange: '#f97316',
  teal: '#0d9488',
  green: '#16a34a',
  purple: '#722ed1',
  rose: '#e11d48',
  charcoal: '#161616',
}

const DEFAULT_SETTINGS = {
  themeMode: 'light',
  primaryPreset: 'blue',
  primaryColor: PRIMARY_PRESETS.blue,
  borderRadius: 8,
  compactMode: false,
  fontScale: 'comfortable',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  contentLayout: 'fullscreen',
  headerHeight: 58,
  sidebarCollapsed: false,
  settingsDrawerOpen: false,
  showAnimations: true,
  stickyHeader: true,
}

const STORAGE_KEY = 'react_theme_settings'

// Theme fields the Settings drawer manages. Deliberately excludes transient UI
// state (settingsDrawerOpen) and layout state owned elsewhere (sidebarCollapsed)
// so the drawer's "Save" can't clobber them.
const THEME_SETTING_KEYS = [
  'themeMode',
  'primaryPreset',
  'primaryColor',
  'borderRadius',
  'compactMode',
  'fontScale',
  'fontFamily',
  'contentLayout',
  'headerHeight',
  'showAnimations',
  'stickyHeader',
]

// Everything that survives a reload (theme + the persisted sidebar state).
const PERSISTED_KEYS = [...THEME_SETTING_KEYS, 'sidebarCollapsed']

const pickKeys = (state, keys) =>
  keys.reduce((result, key) => {
    result[key] = state[key]

    return result
  }, {})

export const pickThemeSettings = (state) => pickKeys(state, THEME_SETTING_KEYS)
export const pickPersistedSettings = (state) => pickKeys(state, PERSISTED_KEYS)

const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const storedSettings = loadSettings()

const initialState = {
  ...DEFAULT_SETTINGS,
  ...storedSettings,
  // Never restore a "drawer open" state from a previous session.
  settingsDrawerOpen: false,
  primaryColor:
    storedSettings.primaryColor ??
    PRIMARY_PRESETS[storedSettings.primaryPreset] ??
    DEFAULT_SETTINGS.primaryColor,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    closeSettingsDrawer: (state) => {
      state.settingsDrawerOpen = false
    },
    openSettingsDrawer: (state) => {
      state.settingsDrawerOpen = true
    },
    resetThemeSettings: (state) => {
      Object.assign(state, DEFAULT_SETTINGS, { settingsDrawerOpen: true })
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    updateThemeSettings: (state, action) => {
      Object.assign(state, action.payload)
    },
  },
})

export const {
  closeSettingsDrawer,
  openSettingsDrawer,
  resetThemeSettings,
  setSidebarCollapsed,
  toggleSidebar,
  updateThemeSettings,
} = uiSlice.actions
export { DEFAULT_SETTINGS, STORAGE_KEY }
export default uiSlice.reducer
