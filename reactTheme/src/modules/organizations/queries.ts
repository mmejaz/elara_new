import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Organization } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useOrganizations(params: ServerTableParams) {
  return useQuery({
    queryKey: ['organizations', params],
    queryFn: async (): Promise<Paginated<Organization>> => {
      const { data } = await apiClient.get('/organizations', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * Flat list of all organizations for the "Parent Organization" picker. Uses the
 * same index endpoint with a large page size; shares the ['organizations'] key
 * prefix so create/update/delete invalidations refresh it too.
 */
export function useOrganizationOptions() {
  return useQuery({
    queryKey: ['organizations', 'options'],
    queryFn: async (): Promise<Organization[]> => {
      const { data } = await apiClient.get('/organizations', { params: { per_page: 1000 } })
      return data.data
    },
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/organizations', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/organizations/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/organizations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })
}
