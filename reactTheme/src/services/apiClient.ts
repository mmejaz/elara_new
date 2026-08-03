import axios from 'axios'

/**
 * Multi-tenant: the tenant is resolved by domain, so every request must hit the
 * SAME subdomain the SPA is served from (acme.lvh.me → acme.lvh.me:8000) — that
 * is what sends the .lvh.me session cookie to the right tenant. Derive the
 * backend origin from the live hostname rather than a build-time env var, which
 * could only ever name one host. Fall back to the env var when there is no
 * `window` (SSR / non-jsdom tests).
 */
const backendOrigin =
  typeof window !== 'undefined' && window.location?.hostname
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : import.meta.env.VITE_BACKEND_URL

const apiClient = axios.create({
  baseURL: `${backendOrigin}/api`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
})

/**
 * File uploads send a FormData body. The JSON content type above would override
 * the multipart type (and drop its boundary), so the server would receive no
 * file — strip it and let the browser set `multipart/form-data; boundary=…`.
 */
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

export const initCsrf = () =>
  axios.get(`${backendOrigin}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })

export default apiClient
