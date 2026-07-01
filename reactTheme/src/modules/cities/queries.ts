import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { City } from './types'

async function fetchCities(): Promise<City[]> {
  const { data } = await apiClient.get('/cities')
  return data.data
}

export function useCities() {
  return useQuery({ queryKey: ['cities'], queryFn: fetchCities })
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
