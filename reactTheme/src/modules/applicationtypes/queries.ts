import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { ApplicationType } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useApplicationTypes(params: ServerTableParams) {
  return useQuery({
    queryKey: ['applicationtypes', params],
    queryFn: async (): Promise<Paginated<ApplicationType>> => {
      const { data } = await apiClient.get('/applicationtypes', { params })
      return data
    },
    placeholderData: keepPreviousData, // keep the old page visible while the next loads
  })
}

export function useCreateApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/applicationtypes', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}

export function useUpdateApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/applicationtypes/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}

export function useDeleteApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/applicationtypes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}
