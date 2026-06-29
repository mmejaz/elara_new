import { createSlice } from '@reduxjs/toolkit'

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
    addDrawerOpen: false,
    editDrawerOpen: false,
    editingPermission: null,
  },
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action) => {
      state.editingPermission = action.payload
      state.editDrawerOpen = true
    },
    closeEditDrawer: (state) => {
      state.editDrawerOpen = false
      state.editingPermission = null
    },
  },
})

export const { openAddDrawer, closeAddDrawer, openEditDrawer, closeEditDrawer } =
  permissionsSlice.actions
export default permissionsSlice.reducer
