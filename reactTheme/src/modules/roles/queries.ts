import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Role } from '../../types/models'

async function fetchPermissions() {
  const { data } = await apiClient.get('/permissions')
  return data.data
}

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

/** Server-side paginated + searchable role list for the Roles table. */
export function usePaginatedRoles(params: ServerTableParams) {
  return useQuery({
    queryKey: ['roles-paginated', params],
    queryFn: async (): Promise<Paginated<Role>> => {
      const { data } = await apiClient.get('/roles/paginated', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/roles', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      queryClient.invalidateQueries({ queryKey: ['roles-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) => apiClient.put(`/roles/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      queryClient.invalidateQueries({ queryKey: ['roles-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
