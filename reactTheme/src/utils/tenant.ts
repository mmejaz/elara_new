/**
 * Mirrors `central_domains` in the backend's config/tenancy.php. Anything else
 * (acme.localhost, globex.localhost) is a tenant host.
 *
 * Sourced from VITE_CENTRAL_HOSTS (comma-separated) so production can name its
 * real central domain — hardcoding dev hosts would make the central-only route
 * guards fail closed (redirect away) on the live central host.
 */
const CENTRAL_HOSTS = (import.meta.env.VITE_CENTRAL_HOSTS ?? 'localhost,127.0.0.1')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean)

/** True when the SPA is being served from the central app rather than a tenant. */
export function isCentralHost(): boolean {
  return CENTRAL_HOSTS.includes(window.location.hostname.toLowerCase())
}
