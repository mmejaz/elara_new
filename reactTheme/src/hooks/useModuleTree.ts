import { useQuery } from '@tanstack/react-query'
import apiClient from '../services/apiClient'

async function fetchModuleTree() {
  const { data } = await apiClient.get('/modules/tree')
  return data.data
}

/**
 * The sidebar navigation tree, sourced from the modules table. Cached so the
 * menu doesn't refetch on every route change; invalidated by the Module
 * Builder after a module is created.
 */
export function useModuleTree() {
  return useQuery({
    queryKey: ['modules-tree'],
    queryFn: fetchModuleTree,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
