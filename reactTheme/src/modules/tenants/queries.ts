import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Tenant } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useTenants(params: ServerTableParams) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async (): Promise<Paginated<Tenant>> => {
      const { data } = await apiClient.get('/tenants', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/tenants', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })
}

export function useSetTenantStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      apiClient.post(`/tenants/${id}/${status === 'active' ? 'activate' : 'suspend'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tenants/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants'] }),
  })
}
