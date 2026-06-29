import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'

async function fetchPermissions() {
  const { data } = await apiClient.get('/permissions/list')
  return data.data
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions-list'], queryFn: fetchPermissions })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values) => apiClient.post('/permissions', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-list'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}

export function useUpdatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }) => apiClient.put(`/permissions/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions-list'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}
