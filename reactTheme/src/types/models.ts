// Domain entity types — mirror the Laravel API Resources.
// (Phase 5 option: auto-generate these from spatie/laravel-typescript-transformer.)

export interface UserSettings {
  email_notifications: boolean
  product_updates: boolean
  profile_public: boolean
}

export type UserStatus = 'active' | 'deactivated' | 'blocked'

export interface User {
  id: number
  /** Human-readable public User ID, e.g. "USR-00001". */
  user_code: string
  name: string
  email: string
  status?: UserStatus
  status_reason?: string | null
  phone: string | null
  designation: string | null
  country: string | null
  city: string | null
  bio: string | null
  settings: Partial<UserSettings> | null
  avatar: string | null
  roles: string[]
  /** The department this user belongs to. */
  department_id?: number | null
  department?: { id: number; name: string } | null
  /** The date the user joined (ISO date, e.g. "2026-08-21"). */
  joining_date?: string | null
  /** Organizations this user is assigned to (absent/empty for a Super Admin). */
  organizations?: { id: number; name: string }[]
  organization_ids?: number[]
  created_at: string
}

export interface AuthUser extends User {
  permissions: string[]
}

export interface Role {
  id: number
  name: string
  users_count: number
  permissions_count: number
  permissions: string[]
}

export interface Permission {
  id: number
  name: string
  action: string
  module: string
  roles?: string[]
}

export type ModuleType = 'item' | 'group'

export interface Module {
  id: number
  name: string
  slug: string
  icon: string | null
  type: ModuleType
  is_resourceful: boolean
  parent_id: number | null
  order: number
  is_visible: boolean
  is_system: boolean
  description: string | null
  permissions: string[]
  children?: Module[]
}
