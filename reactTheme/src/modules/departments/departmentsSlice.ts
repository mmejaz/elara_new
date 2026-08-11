import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Department } from './types'

interface DepartmentsUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: Department | null
}

const initialState: DepartmentsUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Department>) => {
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
  departmentsSlice.actions
export default departmentsSlice.reducer
