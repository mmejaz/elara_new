import { useEffect, useState } from 'react'
import apiClient from '../services/apiClient'
import { isCentralHost } from '../utils/tenantUtils'

/**
 * Verifies that the current tenant exists by calling the verify-tenant endpoint.
 * For central hosts, skips verification entirely.
 * For tenant subdomains, MUST verify before app can load.
 */
export const useTenantVerification = () => {
  const [status, setStatus] = useState<'loading' | 'verified' | 'not-found' | 'error'>('loading')
  const [tenantInfo, setTenantInfo] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    const verifyTenant = async () => {
      // Central hosts don't need verification
      if (isCentralHost()) {
        setStatus('verified')
        return
      }

      try {
        const startTime = performance.now()
        const response = await apiClient.get('/verify-tenant', {
          timeout: 8000, // 8 second timeout for tenant verification
        })

        const duration = (performance.now() - startTime).toFixed(0)

        if (response.status === 200) {
          setTenantInfo(response.data?.data)
          setStatus('verified')
          console.log(`[Tenant Verification] ✅ Verified in ${duration}ms:`, response.data?.data?.id)
        }
      } catch (error: any) {
        const duration = (performance.now() - startTime).toFixed(0)
        console.error(`[Tenant Verification] Error after ${duration}ms:`, error.response?.status, error.message)

        // 404 means tenant not found - block access
        if (error.response?.status === 404) {
          console.warn('[Tenant Verification] ❌ Tenant not found (404)')
          setStatus('not-found')
        } else {
          // Network errors or other server errors - block access too
          console.error('[Tenant Verification] ❌ Verification failed:', error.message)
          setStatus('error')
        }
      }
    }

    verifyTenant()
  }, [])

  return { status, tenantInfo, isLoading: status === 'loading' }
}
