import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { DocumentType } from './types'

interface DocumentTypesUiState {
  addDrawerOpen: boolean
  editDrawerOpen: boolean
  editing: DocumentType | null
}

const initialState: DocumentTypesUiState = {
  addDrawerOpen: false,
  editDrawerOpen: false,
  editing: null,
}

const documentTypesSlice = createSlice({
  name: 'documentTypes',
  initialState,
  reducers: {
    openAddDrawer: (state) => {
      state.addDrawerOpen = true
    },
    closeAddDrawer: (state) => {
      state.addDrawerOpen = false
    },
    openEditDrawer: (state, action: PayloadAction<DocumentType>) => {
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
  documentTypesSlice.actions
export default documentTypesSlice.reducer
