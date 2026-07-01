import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types/models'

interface UsersUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editingUser: User | null
}

const initialState: UsersUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editingUser: null,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<User>) => {
      state.editingUser = action.payload
      state.editDrawerOpen = true
    },
    closeEditDrawer: (state) => {
      state.editDrawerOpen = false
      state.editingUser = null
    },
  },
})

export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
  usersSlice.actions
export default usersSlice.reducer
