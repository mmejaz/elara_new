import { queryClient } from '../services/queryClient'
import { MODULE_TREE_CACHE_KEY } from '../hooks/useModuleTree'

/**
 * Wipe all client-held user data. Called on logout and when the server rejects
 * the session (401), so the next user on the same browser never sees the
 * previous one's cached navigation tree or query results flash before a refetch.
 */
export function clearClientCaches(): void {
  try {
    localStorage.removeItem(MODULE_TREE_CACHE_KEY)
  } catch {
    // Ignore storage failures (private mode, quota).
  }

  queryClient.clear()
}
