import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../services/apiClient'
import type { CreateWidgetInput, DashboardMatrix, DashboardWidget } from './types'

/** Super Admin: the full role × widget editing matrix. */
export function useDashboardMatrix() {
  return useQuery({
    queryKey: ['dashboard-settings'],
    queryFn: async (): Promise<DashboardMatrix> => {
      const { data } = await apiClient.get('/dashboard-settings')
      return data.data
    },
  })
}

/** Save every role's config (parallel PUTs); returns after all complete. */
export function useSaveDashboardMatrix() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roles: Array<{ id: number; config: Record<string, boolean> }>) =>
      Promise.all(roles.map((r) => apiClient.put(`/dashboard-settings/${r.id}`, { config: r.config }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
    },
  })
}

/** Super Admin: add a new widget to the catalog. */
export function useCreateWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWidgetInput) => apiClient.post('/dashboard-settings/widgets', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
    },
  })
}

/** Super Admin: update a widget (label, icon, or the master show/hide toggle). */
export function useUpdateWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, ...patch }: { key: string } & Partial<Pick<DashboardWidget, 'label' | 'icon' | 'is_active'>>) =>
      apiClient.patch(`/dashboard-settings/widgets/${key}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
    },
  })
}

/** Super Admin: remove a widget from the catalog. */
export function useDeleteWidget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => apiClient.delete(`/dashboard-settings/widgets/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets'] })
    },
  })
}

/** The current user's effective (visible) dashboard widgets — union across roles. */
export function useMyDashboardWidgets() {
  return useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: async (): Promise<DashboardWidget[]> => {
      const { data } = await apiClient.get('/dashboard/widgets')
      return data.data.widgets
    },
    staleTime: 5 * 60 * 1000,
  })
}
