import { Checkbox, Collapse, Empty, Input, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useMemo, useState, type ReactNode } from 'react'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  view: { label: 'View', color: 'blue' },
  create: { label: 'Create', color: 'green' },
  edit: { label: 'Edit', color: 'orange' },
  delete: { label: 'Delete', color: 'red' },
  export: { label: 'Export', color: 'purple' },
}

interface PermEntry {
  name: string
  action: string
}

function groupPermissions(permissions: string[]): Record<string, PermEntry[]> {
  const modules: Record<string, PermEntry[]> = {}

  for (const perm of permissions) {
    // Names are "{module}.{action}" with underscores for spaces.
    const [rawModule = 'general', action = ''] = perm.split('.')
    const key = rawModule
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

    if (!modules[key]) modules[key] = []
    modules[key].push({ name: perm, action })
  }

  return modules
}

interface PermissionPickerProps {
  permissions?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
  /** Read-only mode — checkboxes reflect `value` but can't be changed (e.g. a role preview). */
  disabled?: boolean
  /** Optional heading rendered on the LEFT of the header row; the module search sits on the right. */
  title?: ReactNode
}

function PermissionPicker({ permissions = [], value = [], onChange, disabled = false, title }: PermissionPickerProps) {
  const grouped = useMemo(() => groupPermissions(permissions), [permissions])
  const [query, setQuery] = useState('')
  // Modules the user has manually expanded (ignored while a search is active).
  const [openKeys, setOpenKeys] = useState<string[]>([])

  const toggle = (perm: string) => {
    const next = value.includes(perm)
      ? value.filter((p) => p !== perm)
      : [...value, perm]
    onChange?.(next)
  }

  const toggleModule = (modulePerms: PermEntry[], checked: boolean) => {
    const names = modulePerms.map((p) => p.name)
    const next = checked
      ? [...new Set([...value, ...names])]
      : value.filter((p) => !names.includes(p))
    onChange?.(next)
  }

  const q = query.trim().toLowerCase()
  const entries = Object.entries(grouped).filter(([module]) => !q || module.toLowerCase().includes(q))

  const items = entries.map(([module, perms]) => {
    const names = perms.map((p) => p.name)
    const selectedCount = names.filter((n) => value.includes(n)).length
    const allChecked = selectedCount === names.length
    const someChecked = selectedCount > 0 && !allChecked

    return {
      key: module,
      label: (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allChecked}
            indeterminate={someChecked}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => toggleModule(perms, e.target.checked)}
          />
          <span className="font-medium">{module}</span>
          {selectedCount > 0 && (
            <Tag color="processing" className="!text-xs">
              {selectedCount}/{names.length}
            </Tag>
          )}
        </div>
      ),
      children: (
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 pl-6 sm:grid-cols-4">
          {perms.map(({ name, action }) => {
            const meta = ACTION_LABELS[action] ?? { label: action, color: 'default' }
            return (
              <Checkbox
                key={name}
                checked={value.includes(name)}
                disabled={disabled}
                onChange={() => toggle(name)}
              >
                <Tag color={meta.color} className="!text-xs !m-0">
                  {meta.label}
                </Tag>
              </Checkbox>
            )
          })}
        </div>
      ),
    }
  })

  const showSearch = !disabled

  return (
    <div className="w-full">
      {(title || showSearch) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{title}</div>
          {showSearch && (
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search modules…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: '0 1 260px', maxWidth: 260 }}
            />
          )}
        </div>
      )}

      {items.length ? (
        <Collapse
          items={items}
          // While searching, expand every match so the actions are visible at a
          // glance; otherwise respect what the user has opened manually.
          activeKey={q ? entries.map(([module]) => module) : openKeys}
          onChange={(keys) => setOpenKeys(keys as string[])}
          className="w-full"
          expandIconPosition="end"
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No modules match “${query}”`}
          className="!my-6"
        />
      )}
    </div>
  )
}

export default PermissionPicker
