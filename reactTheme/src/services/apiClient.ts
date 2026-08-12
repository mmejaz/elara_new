import axios from 'axios'

/**
 * Tenants are identified by the request host, so the API has to be called on the
 * same subdomain the SPA is being served from:
 *
 *   localhost:5173      -> localhost:8000       (central)
 *   acme.localhost:5173 -> acme.localhost:8000  (tenant "acme")
 *
 * Protocol and port come from VITE_BACKEND_URL; only the hostname is taken from
 * the browser. Hardcoding the env host instead would send every tenant's
 * requests to the central domain, where their users don't exist.
 */
const backendOrigin = () => {
  const configured = new URL(import.meta.env.VITE_BACKEND_URL)
  configured.hostname = window.location.hostname

  return configured.origin
}

const apiClient = axios.create({
  baseURL: `${backendOrigin()}/api`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
  timeout: 30000, // 30 second timeout
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
  axios.get(`${backendOrigin()}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })

export default apiClient
