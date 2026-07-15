import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { User } from '../../types/models'

async function fetchUsers() {
  const { data } = await apiClient.get('/users')
  return data.data
}

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

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers })
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
