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
 * Origin to send a visitor to when their host names a tenant that doesn't exist.
 *
 * Keeps the current scheme and port and swaps only the hostname, because the SPA
 * and the API are served on different ports in development — using the backend's
 * absolute URL would drop the user on the API origin.
 *
 * `host` is the `central_host` the backend returns alongside a tenant-not-found
 * response; it falls back to the first VITE_CENTRAL_HOSTS entry so a redirect
 * still works when the response carried no payload (network error, timeout).
 */
export const centralOrigin = (host?: string | null): string => {
  const target = new URL(window.location.href)

  target.hostname = host || CENTRAL_HOSTS[0]
  target.pathname = '/'
  target.search = ''
  target.hash = ''

  return target.toString()
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
