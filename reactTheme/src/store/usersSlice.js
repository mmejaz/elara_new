import { createSlice } from '@reduxjs/toolkit'

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    addDrawerOpen: false,
  },
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
  },
})

export const { openAddDrawer, closeAddDrawer } = usersSlice.actions
export default usersSlice.reducer
