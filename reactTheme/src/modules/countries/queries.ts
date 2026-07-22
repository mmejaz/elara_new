import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Country } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useCountries(params: ServerTableParams) {
  return useQuery({
    queryKey: ['countries', params],
    queryFn: async (): Promise<Paginated<Country>> => {
      const { data } = await apiClient.get('/countries', { params })
      return data
    },
    placeholderData: keepPreviousData, // keep the old page visible while the next loads
  })
}

export function useCreateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/countries', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['countries'] }),
  })
}

export function useUpdateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/countries/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['countries'] }),
  })
}

export function useDeleteCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/countries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['countries'] }),
  })
}
