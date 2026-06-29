import { createSlice } from '@reduxjs/toolkit'

const rolesSlice = createSlice({
  name: 'roles',
  initialState: {
    addDrawerOpen: false,
    editDrawerOpen: false,
    editingRole: null,
  },
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action) => {
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
