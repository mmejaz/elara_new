import { createSlice } from '@reduxjs/toolkit'

const moduleBuilderSlice = createSlice({
  name: 'moduleBuilder',
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

export const { openAddDrawer, closeAddDrawer } = moduleBuilderSlice.actions
export default moduleBuilderSlice.reducer
