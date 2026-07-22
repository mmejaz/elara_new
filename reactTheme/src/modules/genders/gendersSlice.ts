import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Gender } from './types'

interface GendersUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: Gender | null
}

const initialState: GendersUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const gendersSlice = createSlice({
  name: 'genders',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Gender>) => {
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
  gendersSlice.actions
export default gendersSlice.reducer
