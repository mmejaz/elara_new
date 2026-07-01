import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { Country } from './types'

async function fetchCountries(): Promise<Country[]> {
  const { data } = await apiClient.get('/countries')
  return data.data
}

export function useCountries() {
  return useQuery({ queryKey: ['countries'], queryFn: fetchCountries })
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
