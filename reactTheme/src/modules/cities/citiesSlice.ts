import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { City } from './types'

interface CitiesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: City | null
}

const initialState: CitiesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const citiesSlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<City>) => {
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
  citiesSlice.actions
export default citiesSlice.reducer
