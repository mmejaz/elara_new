import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Organization } from './types'

interface OrganizationsUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: Organization | null
}

const initialState: OrganizationsUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Organization>) => {
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
  organizationsSlice.actions
export default organizationsSlice.reducer
