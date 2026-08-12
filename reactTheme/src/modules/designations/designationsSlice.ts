import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Designation } from './types'

interface DesignationsUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: Designation | null
}

const initialState: DesignationsUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const designationsSlice = createSlice({
  name: 'designations',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Designation>) => {
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
  designationsSlice.actions
export default designationsSlice.reducer
