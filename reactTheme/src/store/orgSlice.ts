import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const ORG_STORAGE_KEY = 'elara.currentOrganizationId'

/** The organization the user is currently working within. null = All / none. */
const loadInitial = (): number | null => {
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

interface OrgState {
  currentOrganizationId: number | null
}

const initialState: OrgState = {
  currentOrganizationId: loadInitial(),
}

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<number | null>) => {
      state.currentOrganizationId = action.payload
    },
  },
})

export const { setCurrentOrganization } = orgSlice.actions
export default orgSlice.reducer
