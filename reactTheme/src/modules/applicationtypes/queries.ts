import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ApplicationType } from './types'

async function fetchApplicationTypes(): Promise<ApplicationType[]> {
  const { data } = await apiClient.get('/applicationtypes')
  return data.data
}

export function useApplicationTypes() {
  return useQuery({ queryKey: ['applicationtypes'], queryFn: fetchApplicationTypes })
}

export function useCreateApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/applicationtypes', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}

export function useUpdateApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/applicationtypes/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}

export function useDeleteApplicationType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/applicationtypes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicationtypes'] }),
  })
}
