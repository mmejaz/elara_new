export interface Department {
  id: number
  name: string
  parent_id: number | null
  /** Minimal parent summary from the API (null for a top-level department). */
  parent?: { id: number; name: string } | null
  /** Owning organization id — null means a shared, tenant-wide department. */
  organization_id: number | null
  /** Minimal organization summary from the API (null when shared). */
  organization?: { id: number; name: string } | null
  created_at: string
}
