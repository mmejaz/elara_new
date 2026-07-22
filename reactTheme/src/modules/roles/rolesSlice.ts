import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Role } from '../../types/models'

interface RolesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editingRole: Role | null
}

const initialState: RolesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editingRole: null,
}

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Role>) => {
      state.editingRole = action.payload
      state.editDrawerOpen = true
    },
    closeEditDrawer: (state) => {
      state.editDrawerOpen = false
      state.editingRole = null
    },
  },
})

export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
  rolesSlice.actions
export default rolesSlice.reducer
