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
  created_at: string | null
}
