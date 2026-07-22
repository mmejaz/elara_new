import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { City } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useCities(params: ServerTableParams) {
  return useQuery({
    queryKey: ['cities', params],
    queryFn: async (): Promise<Paginated<City>> => {
      const { data } = await apiClient.get('/cities', { params })
      return data
    },
    placeholderData: keepPreviousData, // keep the old page visible while the next loads
  })
}

export function useCreateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/cities', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })
}

export function useUpdateCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/cities/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })
}

export function useDeleteCity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/cities/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })
}
