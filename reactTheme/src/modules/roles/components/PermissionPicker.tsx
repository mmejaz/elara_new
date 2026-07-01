import { Checkbox, Collapse, Tag } from 'antd'
import { useMemo } from 'react'

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
}

function PermissionPicker({ permissions = [], value = [], onChange }: PermissionPickerProps) {
  const grouped = useMemo(() => groupPermissions(permissions), [permissions])

  const toggle = (perm) => {
    const next = value.includes(perm)
      ? value.filter((p) => p !== perm)
      : [...value, perm]
    onChange?.(next)
  }

  const toggleModule = (modulePerms, checked) => {
    const names = modulePerms.map((p) => p.name)
    const next = checked
      ? [...new Set([...value, ...names])]
      : value.filter((p) => !names.includes(p))
    onChange?.(next)
  }

  const items = Object.entries(grouped).map(([module, perms]) => {
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

  return (
    <Collapse
      items={items}
      defaultActiveKey={[]}
      className="w-full"
      expandIconPosition="end"
    />
  )
}

export default PermissionPicker
