import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'

async function fetchRoles() {
  const { data } = await apiClient.get('/roles/list')
  return data.data
}

async function fetchPermissions() {
  const { data } = await apiClient.get('/permissions')
  return data.data
}

export function useRoles() {
  return useQuery({ queryKey: ['roles-list'], queryFn: fetchRoles })
}

export function usePermissions() {
  return useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/roles', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) => apiClient.put(`/roles/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-list'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
