/**
 * Central hosts that don't require tenant verification.
 * Must match the backend's config/tenancy.php central_domains.
 */
const CENTRAL_HOSTS = (import.meta.env.VITE_CENTRAL_HOSTS || 'localhost,127.0.0.1')
  .split(',')
  .map((h) => h.trim())

/**
 * Checks if the current host is a central domain (not a tenant subdomain).
 */
export const isCentralHost = (): boolean => {
  const hostname = window.location.hostname
  return CENTRAL_HOSTS.includes(hostname)
}

/**
 * Gets the current tenant ID from the hostname (first part of subdomain).
 * Returns null if on central host.
 *
 * Examples:
 *   acme.localhost → "acme"
 *   beta.localhost → "beta"
 *   localhost → null
 */
export const getTenantIdFromHostname = (): string | null => {
  if (isCentralHost()) {
    return null
  }

  const hostname = window.location.hostname
  const parts = hostname.split('.')
  return parts.length > 1 ? parts[0] : null
}
