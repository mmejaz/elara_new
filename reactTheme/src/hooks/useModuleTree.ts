import { useQuery } from '@tanstack/react-query'
import apiClient from '../services/apiClient'
import type { Module } from '../types/models'

// Persist the last-known tree so a hard reload can paint the real menu
// immediately, instead of flashing the static fallback while /modules/tree is
// still in flight (which made the sidebar visibly rebuild "by parts").
export const MODULE_TREE_CACHE_KEY = 'elara.modules-tree'

function readCachedTree(): Module[] | undefined {
  try {
    const raw = localStorage.getItem(MODULE_TREE_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Module[]) : undefined
  } catch {
    return undefined
  }
}

async function fetchModuleTree(): Promise<Module[]> {
  const { data } = await apiClient.get('/modules/tree')
  try {
    localStorage.setItem(MODULE_TREE_CACHE_KEY, JSON.stringify(data.data))
  } catch {
    // Best-effort cache — ignore quota/serialization failures.
  }
  return data.data
}

/**
 * The sidebar navigation tree, sourced from the modules table. Seeded from a
 * localStorage cache so the menu renders in full on a hard reload with no flash,
 * then refetched in the background to stay current. Cached so the menu doesn't
 * refetch on every route change; invalidated by the Module Builder after a
 * module is created (which refreshes the cache too).
 */
export function useModuleTree() {
  return useQuery({
    queryKey: ['modules-tree'],
    queryFn: fetchModuleTree,
    initialData: readCachedTree,
    // Treat the cached seed as already stale so the menu still refreshes in the
    // background on mount, while showing the cached tree immediately.
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
