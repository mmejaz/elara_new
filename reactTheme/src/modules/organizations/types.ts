export interface Organization {
  id: number
  name: string
  parent_id: number | null
  /** Minimal parent summary from the API (null for a top-level organization). */
  parent?: { id: number; name: string } | null
  created_at: string
}
