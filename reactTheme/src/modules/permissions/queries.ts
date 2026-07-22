import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Permission } from '../../types/models'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

/** Server-side paginated + searchable permission list for the Permissions table. */
export function usePermissionsPaginated(params: ServerTableParams) {
  return useQuery({
    queryKey: ['permissions-paginated', params],
    queryFn: async (): Promise<Paginated<Permission>> => {
      const { data } = await apiClient.get('/permissions/paginated', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/permissions', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-list'] })
      queryClient.invalidateQueries({ queryKey: ['permissions-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) => apiClient.put(`/permissions/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-list'] })
      queryClient.invalidateQueries({ queryKey: ['permissions-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}
