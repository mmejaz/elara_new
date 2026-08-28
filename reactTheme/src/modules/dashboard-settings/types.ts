export interface DashboardWidget {
  key: string
  label: string
  /** Short icon token the SPA maps to an Ant Design icon (see ICONS map). */
  icon?: string | null
  /** Master show/hide toggle — when false the widget is hidden for everyone. */
  is_active?: boolean
}

export interface CreateWidgetInput {
  label: string
  key?: string
  icon?: string
}

export interface DashboardRoleConfig {
  id: number
  name: string
  /** widgetKey -> visible */
  config: Record<string, boolean>
}

export interface DashboardMatrix {
  widgets: DashboardWidget[]
  roles: DashboardRoleConfig[]
}
