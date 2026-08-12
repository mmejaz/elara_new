import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { DocumentType } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useDocumentTypes(params: ServerTableParams) {
  return useQuery({
    queryKey: ['documenttypes', params],
    queryFn: async (): Promise<Paginated<DocumentType>> => {
      const { data } = await apiClient.get('/documenttypes', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/documenttypes', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documenttypes'] }),
  })
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/documenttypes/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documenttypes'] }),
  })
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/documenttypes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documenttypes'] }),
  })
}
