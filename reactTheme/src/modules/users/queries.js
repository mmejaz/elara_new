import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'

async function fetchUsers() {
  const { data } = await apiClient.get('/users')
  return data.data
}

async function fetchRoles() {
  const { data } = await apiClient.get('/roles')
  return data.data
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values) => apiClient.post('/users', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
