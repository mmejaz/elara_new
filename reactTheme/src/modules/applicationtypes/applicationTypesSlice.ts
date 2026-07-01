import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ApplicationType } from './types'

interface ApplicationTypesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: ApplicationType | null
}

const initialState: ApplicationTypesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const applicationTypesSlice = createSlice({
  name: 'applicationTypes',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<ApplicationType>) => {
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
  applicationTypesSlice.actions
export default applicationTypesSlice.reducer
