import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient, { initCsrf } from '../services/apiClient'
import type { ApiError } from '../types/api'
import type { AuthUser } from '../types/models'

interface AuthPayload {
  user: AuthUser
  roles: string[]
  permissions: string[]
}

interface LoginRejection {
  message: string
  errors: Record<string, string[]>
}

interface AuthState {
  user: AuthUser | null
  roles: string[]
  permissions: string[]
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  fieldErrors: Record<string, string[]>
  checked: boolean
}

export const login = createAsyncThunk<
  AuthPayload,
  { email: string; password: string },
  { rejectValue: LoginRejection }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    await initCsrf()
    const { data } = await apiClient.post('/login', { email, password })
    return data.data
  } catch (error) {
    const e = error as ApiError
    return rejectWithValue({
      message: e.response?.data?.message || 'Login failed',
      errors: e.response?.data?.errors ?? {},
    })
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/logout')
})

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/user')
      return data.data
    } catch {
      return rejectWithValue(null)
    }
  },
)

const initialState: AuthState = {
  user: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  loading: false,
  error: null,
  fieldErrors: {},
  checked: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.isAuthenticated = true
    },
    clearCredentials: (state) => {
      state.user = null
      state.roles = []
      state.permissions = []
      state.isAuthenticated = false
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.roles = action.payload.roles ?? []
        state.permissions = action.payload.permissions ?? []
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? 'Login failed'
        state.fieldErrors = action.payload?.errors ?? {}
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
      })
      // fetchUser
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.roles = action.payload.roles ?? []
        state.permissions = action.payload.permissions ?? []
        state.isAuthenticated = true
        state.checked = true
      })
      .addCase(fetchUser.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.checked = true
      })
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer
