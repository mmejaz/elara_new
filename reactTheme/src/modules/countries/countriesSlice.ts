import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Country } from './types'

interface CountriesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: Country | null
}

const initialState: CountriesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<Country>) => {
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
  countriesSlice.actions
export default countriesSlice.reducer
