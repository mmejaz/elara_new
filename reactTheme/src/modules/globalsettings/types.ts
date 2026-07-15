export type FieldType =
  | 'text'
  | 'number'
  | 'password'
  | 'textarea'
  | 'dropdown'
  | 'boolean'
  | 'date'

export interface GlobalSettingField {
  id?: number
  label: string
  key: string
  type: FieldType
  options: string[]
  is_required: boolean
  sort_order?: number
}

export interface GlobalSetting {
  id: number
  name: string
  fields?: GlobalSettingField[]
  fields_count?: number
  records_count?: number
  created_at: string
}

export interface GlobalSettingRecord {
  id: number
  data: Record<string, unknown>
  created_at: string
}
