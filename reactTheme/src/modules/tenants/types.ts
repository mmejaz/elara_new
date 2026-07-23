export interface Tenant {
  id: string
  name: string
  status: 'active' | 'suspended'
  email: string | null
  phone: string | null
  timezone: string | null
  currency: string | null
  language: string | null
  domains: string[]
  /** Physical database backing this tenant, e.g. "tenantacme". */
  database: string | null
  admin_name: string | null
  admin_email: string | null
  created_at: string | null
  updated_at: string | null
}
