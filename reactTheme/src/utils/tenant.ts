/**
 * Mirrors `central_domains` in the backend's config/tenancy.php. Anything else
 * (acme.localhost, globex.localhost) is a tenant host.
 */
const CENTRAL_HOSTS = ['localhost', '127.0.0.1']

/** True when the SPA is being served from the central app rather than a tenant. */
export function isCentralHost(): boolean {
  return CENTRAL_HOSTS.includes(window.location.hostname)
}
