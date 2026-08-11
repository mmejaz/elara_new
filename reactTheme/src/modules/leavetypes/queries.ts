import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { LeaveType } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useLeaveTypes(params: ServerTableParams) {
  return useQuery({
    queryKey: ['leavetypes', params],
    queryFn: async (): Promise<Paginated<LeaveType>> => {
      const { data } = await apiClient.get('/leavetypes', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/leavetypes', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leavetypes'] }),
  })
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/leavetypes/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leavetypes'] }),
  })
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/leavetypes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leavetypes'] }),
  })
}
