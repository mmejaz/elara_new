import { PushpinOutlined, SettingOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Input, Popover, Space, Table, Tabs, Tooltip } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export interface ServerTableParams {
  page: number
  per_page: number
  search?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

/**
 * Drives a SERVER-side paginated table: owns page/pageSize/search/sort, gives
 * you the query `params`, a bound search input, and an antd Table `onChange`.
 *
 *   const table = useServerTable(15, 'Search…')
 *   const { data, isLoading } = useThings(table.params)   // TanStack Query
 *   <PageHeader extra={table.searchInput} />
 *   <DataTable dataSource={data?.data} loading={isLoading}
 *     server={{ total: data?.meta.total ?? 0, page: table.page,
 *               pageSize: table.pageSize, onChange: table.onChange }} />
 */
export function useServerTable(
  defaultPageSize = 15,
  searchPlaceholder = 'Search…',
  debounceMs = 350,
) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [search, setSearch] = useState('') // instant input value
  const [debouncedSearch, setDebouncedSearch] = useState('') // value sent to the server
  const [sort, setSort] = useState<{ by?: string; dir?: 'asc' | 'desc' }>({})

  // Debounce the search term so we hit the API once the user pauses, not per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // new search → back to the first page
    }, debounceMs)
    return () => clearTimeout(id)
  }, [search, debounceMs])

  const searchInput = (
    <Input
      allowClear
      prefix={<SearchOutlined />}
      placeholder={searchPlaceholder}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{ maxWidth: 280 }}
    />
  )

  const params: ServerTableParams = {
    page,
    per_page: pageSize,
    search: debouncedSearch || undefined,
    sort_by: sort.by,
    sort_dir: sort.dir,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic table row
  const onChange: NonNullable<TableProps<any>['onChange']> = (pag, _filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    setSort(s?.order ? { by: s.field as string, dir: s.order === 'ascend' ? 'asc' : 'desc' } : {})
    setPage(pag.current ?? 1)
    setPageSize(pag.pageSize ?? defaultPageSize)
  }

  return { params, page, pageSize, search, searchInput, onChange }
}

// A stable identity for a column (for show/hide + React keys).
function columnKey(col: Record<string, unknown>, index: number): string {
  return String(col.key ?? col.dataIndex ?? index)
}

/**
 * Column control. Returns the transformed columns (visibility + sticky/pin
 * applied) plus a gear-button node with a TABBED popover:
 *   • "Columns" tab → show / hide columns
 *   • "Sticky"  tab → pin columns to the left (frozen while scrolling)
 *
 *   const { visibleColumns, control } = useColumnToggle(columns)
 *   <PageHeader titleExtra={control} />
 *   <DataTable columns={visibleColumns} showColumnToggle={false} />
 */
export function useColumnToggle<T>(columns: ColumnsType<T>) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [pinned, setPinned] = useState<Set<string>>(new Set())

  const toggleable = columns
    .map((col, i) => ({ col: col as Record<string, unknown>, key: columnKey(col as Record<string, unknown>, i) }))
    .filter(({ col }) => typeof col.title === 'string')

  const visibleColumns = useMemo(
    () =>
      columns
        .filter((col, i) => !hidden.has(columnKey(col as Record<string, unknown>, i)))
        .map((col, i) => {
          const key = columnKey(col as Record<string, unknown>, i)
          return pinned.has(key) ? { ...col, fixed: 'left' as const } : col
        }),
    [columns, hidden, pinned],
  )

  const toggle = (setState: typeof setHidden, key: string, on: boolean) =>
    setState((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })

  const columnsTab = (
    <div style={{ maxHeight: 280, overflow: 'auto', minWidth: 200 }}>
      {toggleable.map(({ col, key }) => (
        <div key={key} className="px-1 py-1">
          <Checkbox
            checked={!hidden.has(key)}
            onChange={(e) => toggle(setHidden, key, !e.target.checked)}
          >
            {col.title as string}
          </Checkbox>
        </div>
      ))}
    </div>
  )

  const stickyTab = (
    <div style={{ maxHeight: 280, overflow: 'auto', minWidth: 200 }}>
      {toggleable.map(({ col, key }) => (
        <div key={key} className="px-1 py-1">
          <Checkbox
            checked={pinned.has(key)}
            disabled={hidden.has(key)}
            onChange={(e) => toggle(setPinned, key, e.target.checked)}
          >
            {col.title as string}
          </Checkbox>
        </div>
      ))}
    </div>
  )

  const panel = (
    <Tabs
      size="small"
      items={[
        { key: 'columns', label: 'Columns', children: columnsTab },
        { key: 'sticky', label: 'Sticky', icon: <PushpinOutlined />, children: stickyTab },
      ]}
    />
  )

  const control = (
    <Popover content={panel} trigger="click" placement="bottomLeft">
      <Tooltip title="Columns & sticky">
        <Button icon={<SettingOutlined />} />
      </Tooltip>
    </Popover>
  )

  return { visibleColumns, control }
}

/**
 * A styled search input bound to its own state — render it ANYWHERE (toolbar or
 * a PageHeader) and pass its `value` to <DataTable searchValue={...} />.
 *
 *   const { value, input } = useTableSearch('Search…')
 *   <PageHeader extra={input} />
 *   <DataTable searchValue={value} searchable={false} />
 */
export function useTableSearch(placeholder = 'Search…') {
  const [value, setValue] = useState('')
  const input = (
    <Input
      allowClear
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ maxWidth: 280 }}
    />
  )
  return { value, input }
}

interface DataTableProps<T> {
  columns: ColumnsType<T>
  dataSource: T[]
  loading?: boolean
  rowKey?: string
  /** Built-in search box (client-side). Default true. */
  searchable?: boolean
  /** Controlled search value (e.g. from useTableSearch). Hides the built-in box. */
  searchValue?: string
  searchPlaceholder?: string
  /** Row fields to search. Defaults to every column's (string) dataIndex. */
  searchKeys?: string[]
  /** Extra actions rendered on the toolbar (e.g. an "Add" button). */
  toolbar?: ReactNode
  /** Render the built-in show/hide-columns gear in the toolbar. Default true.
   *  Set false when you place the gear elsewhere via useColumnToggle(). */
  showColumnToggle?: boolean
  /** Sticky header while scrolling. Default true. */
  sticky?: boolean
  /** Row density. Default 'small' (compact). */
  size?: 'small' | 'middle' | 'large'
  pageSize?: number
  scrollX?: number | true
  /** Server-side pagination. When set, client search/pagination are bypassed. */
  server?: {
    total: number
    page: number
    pageSize: number
    onChange: NonNullable<TableProps<T>['onChange']>
  }
}

/**
 * Reusable table with global search, sticky header, and (optional) built-in
 * show/hide columns. Native AntD `filters`/`onFilter`/`sorter` still work — just
 * define them on the columns you pass in.
 */
function DataTable<T extends object>({
  columns,
  dataSource,
  loading,
  rowKey = 'id',
  searchable = true,
  searchValue,
  searchPlaceholder = 'Search…',
  searchKeys,
  toolbar,
  showColumnToggle = true,
  sticky = true,
  size = 'small',
  pageSize = 15,
  scrollX = true,
  server,
}: DataTableProps<T>) {
  const [internalQuery, setInternalQuery] = useState('')
  const { visibleColumns, control } = useColumnToggle(columns)

  // Controlled (external) search takes precedence over the built-in box.
  const isControlledSearch = searchValue !== undefined
  const query = isControlledSearch ? searchValue : internalQuery
  const showInternalSearch = searchable && !isControlledSearch

  // When the gear is handled externally, render the columns as given.
  const displayedColumns = showColumnToggle ? visibleColumns : columns

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dataSource

    const keys =
      searchKeys ??
      (columns
        .map((col) => (col as Record<string, unknown>).dataIndex)
        .filter((d): d is string => typeof d === 'string'))

    return dataSource.filter((row) =>
      keys.some((k) => {
        const value = (row as Record<string, unknown>)[k]
        return value != null && String(value).toLowerCase().includes(q)
      }),
    )
  }, [dataSource, query, searchKeys, columns])

  const hasToolbar = showInternalSearch || toolbar || showColumnToggle

  return (
    <Card styles={{ body: { padding: 18 } }}>
      {hasToolbar && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            {showInternalSearch && (
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={searchPlaceholder}
                value={internalQuery}
                onChange={(e) => setInternalQuery(e.target.value)}
                size="large"
                style={{ maxWidth: 320 }}
              />
            )}
          </div>
          <Space>
            {toolbar}
            {showColumnToggle && control}
          </Space>
        </div>
      )}

      <Table<T>
        rowKey={rowKey}
        size={size}
        columns={displayedColumns}
        dataSource={server ? dataSource : filtered}
        loading={loading}
        sticky={sticky}
        onChange={server ? server.onChange : undefined}
        pagination={
          server
            ? {
                current: server.page,
                pageSize: server.pageSize,
                total: server.total,
                showSizeChanger: true,
              }
            : { pageSize, showSizeChanger: false }
        }
        scroll={{ x: scrollX }}
      />
    </Card>
  )
}

export default DataTable
