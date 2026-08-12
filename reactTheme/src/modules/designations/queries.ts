import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Designation } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useDesignations(params: ServerTableParams) {
  return useQuery({
    queryKey: ['designations', params],
    queryFn: async (): Promise<Paginated<Designation>> => {
      const { data } = await apiClient.get('/designations', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/designations', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/designations/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/designations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}
