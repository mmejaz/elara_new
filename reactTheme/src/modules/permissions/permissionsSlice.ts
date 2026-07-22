import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Permission } from '../../types/models'

interface PermissionsUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editingPermission: Permission | null
}

const initialState: PermissionsUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editingPermission: null,
}

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Permission>) => {
      state.editingPermission = action.payload
      state.editDrawerOpen = true
    },
    closeEditDrawer: (state) => {
      state.editDrawerOpen = false
      state.editingPermission = null
    },
  },
})

export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
  permissionsSlice.actions
export default permissionsSlice.reducer
