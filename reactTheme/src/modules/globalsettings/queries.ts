import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { ServerTableParams } from '../../components/DataTable'
import type { GlobalSetting, GlobalSettingRecord } from './types'

interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number; last_page: number }
}

export function useGlobalSettings(params: ServerTableParams) {
  return useQuery({
    queryKey: ['globalsettings', params],
    queryFn: async (): Promise<Paginated<GlobalSetting>> => {
      const { data } = await apiClient.get('/globalsettings', { params })
      return data
    },
    placeholderData: keepPreviousData,
  })
}

/** One app with its field definitions — powers the Configure screen. */
export function useGlobalSetting(id: number | null) {
  return useQuery({
    queryKey: ['globalsetting', id],
    queryFn: async (): Promise<GlobalSetting> => {
      const { data } = await apiClient.get(`/globalsettings/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

// ─── Records (the rows added against an app's fields) ───

export function useRecords(appId: number, params: ServerTableParams) {
  return useQuery({
    queryKey: ['globalsetting-records', appId, params],
    queryFn: async (): Promise<Paginated<GlobalSettingRecord>> => {
      const { data } = await apiClient.get(`/globalsettings/${appId}/records`, { params })
      return data
    },
    enabled: !!appId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateRecord(appId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      apiClient.post(`/globalsettings/${appId}/records`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalsetting-records', appId] })
      queryClient.invalidateQueries({ queryKey: ['globalsettings'] })
    },
  })
}

export function useUpdateRecord(appId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/globalsettings/${appId}/records/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalsetting-records', appId] })
      queryClient.invalidateQueries({ queryKey: ['globalsettings'] })
    },
  })
}

export function useCreateGlobalSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/globalsettings', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['globalsettings'] }),
  })
}

export function useUpdateGlobalSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...values }: { id: number } & Record<string, unknown>) =>
      apiClient.put(`/globalsettings/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['globalsettings'] }),
  })
}

export function useDeleteGlobalSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/globalsettings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['globalsettings'] }),
  })
}
