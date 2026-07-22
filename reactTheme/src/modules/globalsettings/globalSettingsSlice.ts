import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GlobalSetting } from './types'

interface GlobalSettingsUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: GlobalSetting | null
}

const initialState: GlobalSettingsUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const globalSettingsSlice = createSlice({
  name: 'globalSettings',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<GlobalSetting>) => {
      state.editing = action.payload
      state.editDrawerOpen = true
    },
    closeEditDrawer: (state) => {
      state.editDrawerOpen = false
      state.editing = null
    },
  },
})

export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
  globalSettingsSlice.actions
export default globalSettingsSlice.reducer
