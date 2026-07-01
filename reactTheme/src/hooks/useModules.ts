import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../services/apiClient'
import type { Module } from '../types/models'

// Module-management queries, shared by the Module Builder and the Managed
// Modules screen (a neutral home so neither feature depends on the other).

async function fetchModules(): Promise<Module[]> {
  const { data } = await apiClient.get('/modules')
  return data.data
}

/** Full module list, including inactive (hidden) modules — for management views. */
export function useModules() {
  return useQuery({
    queryKey: ['modules-list'],
    queryFn: fetchModules,
    retry: false,
  })
}

export function useCreateModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => apiClient.post('/modules', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules-list'] })
      queryClient.invalidateQueries({ queryKey: ['modules-tree'] })
    },
  })
}

/**
 * Toggle a module active/inactive (is_visible). Refreshes both the management
 * list and the sidebar tree.
 */
export function useSetModuleVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_visible }: { id: number; is_visible: boolean }) =>
      apiClient.patch(`/modules/${id}`, { is_visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules-list'] })
      queryClient.invalidateQueries({ queryKey: ['modules-tree'] })
    },
  })
}
