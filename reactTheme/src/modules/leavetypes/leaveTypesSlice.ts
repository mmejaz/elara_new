import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { LeaveType } from './types'

interface LeaveTypesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: LeaveType | null
}

const initialState: LeaveTypesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const leaveTypesSlice = createSlice({
  name: 'leaveTypes',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<LeaveType>) => {
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
  leaveTypesSlice.actions
export default leaveTypesSlice.reducer
