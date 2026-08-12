import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { Department } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useDepartments(params: ServerTableParams) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async (): Promise<Paginated<Department>> => {
      const { data } = await apiClient.get('/departments', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * Flat list of all departments for the "Parent Department" picker. Uses the same
 * index endpoint with a large page size; shares the ['departments'] key prefix so
 * create/update/delete invalidations refresh it too.
 */
export function useDepartmentOptions() {
  return useQuery({
    queryKey: ['departments', 'options'],
    queryFn: async (): Promise<Department[]> => {
      const { data } = await apiClient.get('/departments', { params: { per_page: 1000 } })
      return data.data
    },
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/departments', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/departments/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}
