import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { User } from '../../types/models'
import { useAppDispatch } from '../../store/hooks'
import { fetchUser } from '../../store/authSlice'
import { clearClientCaches } from '../../utils/session'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

interface UserStats {
  total: number
  with_role: number
  without_role: number
}

async function fetchRoles() {
  const { data } = await apiClient.get('/roles')
  return data.data
}

// Full role objects (incl. their permission names) — used to preview a role's access.
async function fetchRolesDetailed() {
  const { data } = await apiClient.get('/roles/list')
  return data.data
}

// All permission names — feeds the collapsible module/permission preview.
async function fetchPermissions() {
  const { data } = await apiClient.get('/permissions')
  return data.data
}

/** Server-side paginated + searchable user list for the Users table. */
export function useUsersPaginated(params: ServerTableParams) {
  return useQuery({
    queryKey: ['users-paginated', params],
    queryFn: async (): Promise<Paginated<User>> => {
      const { data } = await apiClient.get('/users/paginated', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

/** Aggregate counts for the stat cards (independent of pagination). */
export function useUserStats() {
  return useQuery({
    queryKey: ['users-stats'],
    queryFn: async (): Promise<UserStats> => {
      const { data } = await apiClient.get('/users/stats')
      return data.data
    },
  })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
}

export function useRolesDetailed() {
  return useQuery({ queryKey: ['roles-list'], queryFn: fetchRolesDetailed })
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/users', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/users/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
    },
  })
}

// ─── Impersonation ───────────────────────────────────────────────────────────
// Starting/stopping swaps the authenticated user on the server. Clearing all
// client caches + refetching the current user makes the whole app reload as the
// new identity (sidebar, lists, profile), rather than showing the previous
// user's cached data.

export function useImpersonate() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: (userId: number) => apiClient.post(`/users/${userId}/impersonate`),
    onSuccess: async () => {
      clearClientCaches()
      queryClient.clear()
      await dispatch(fetchUser())
    },
  })
}

export function useStopImpersonating() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: () => apiClient.post('/impersonate/stop'),
    onSuccess: async () => {
      clearClientCaches()
      queryClient.clear()
      await dispatch(fetchUser())
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      apiClient.post(`/users/${id}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
    },
  })
}
