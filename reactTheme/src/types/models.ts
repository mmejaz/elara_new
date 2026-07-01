// Domain entity types — mirror the Laravel API Resources.
// (Phase 5 option: auto-generate these from spatie/laravel-typescript-transformer.)

export interface User {
  id: number
  name: string
  email: string
  roles: string[]
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
