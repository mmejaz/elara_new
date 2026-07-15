import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Gender } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useGenders(params: ServerTableParams) {
  return useQuery({
    queryKey: ['genders', params],
    queryFn: async (): Promise<Paginated<Gender>> => {
      const { data } = await apiClient.get('/genders', { params })
      return data
    },
    placeholderData: keepPreviousData, // keep the old page visible while the next loads
  })
}

export function useCreateGender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/genders', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['genders'] }),
  })
}

export function useUpdateGender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/genders/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['genders'] }),
  })
}

export function useDeleteGender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/genders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['genders'] }),
  })
}
