import type { MenuProps } from 'antd'

/**
 * Loads every markdown file bundled under ./content as a raw string (Vite glob),
 * derives a title from the first `# heading`, and builds the sidebar menu tree +
 * a key→doc lookup for the User Guide reader.
 *
 * The content is a copy of the repo's /docs. Re-copy after editing the docs:
 *   Copy-Item docs\* reactTheme\src\modules\user-guide\content -Recurse -Force
 */
const raw = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface DocNode {
  key: string // relative path, e.g. "architecture/backend.md"
  title: string
  content: string
}

function prettify(segment: string): string {
  return segment
    .replace(/\.md$/i, '')
    .replace(/^\d+[-_]/, '') // strip numeric folder prefixes like "07-"
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function titleOf(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+?)\s*$/m)
  return m ? m[1].trim() : fallback
}

// Build the node map keyed by clean relative path.
export const docsByKey: Record<string, DocNode> = {}
for (const [full, content] of Object.entries(raw)) {
  const path = full.replace(/^\.\/content\//, '')
  docsByKey[path] = { key: path, title: titleOf(content, prettify(path)), content }
}

// Group by top-level folder ("" = repo-root docs like README.md).
const groups = new Map<string, DocNode[]>()
for (const node of Object.values(docsByKey)) {
  const slash = node.key.indexOf('/')
  const folder = slash === -1 ? '' : node.key.slice(0, slash)
  if (!groups.has(folder)) groups.set(folder, [])
  groups.get(folder)!.push(node)
}

// Order: numbered folders by number, then named folders A→Z. Root files last.
function folderRank(folder: string): [number, string] {
  const num = folder.match(/^(\d+)/)
  return num ? [Number(num[1]), folder] : [9000, folder]
}
const orderedFolders = [...groups.keys()]
  .filter((f) => f !== '')
  .sort((a, b) => {
    const [na, sa] = folderRank(a)
    const [nb, sb] = folderRank(b)
    return na - nb || sa.localeCompare(sb)
  })

/** The default document shown on open (repo README, else first available). */
export const defaultKey =
  docsByKey['README.md']?.key ?? Object.keys(docsByKey)[0] ?? ''

/** AntD Menu items: root files first (README pinned), then a submenu per folder. */
export const menuItems: MenuProps['items'] = (() => {
  const items: NonNullable<MenuProps['items']> = []

  // Root-level files (README first, then the rest alphabetically).
  const rootFiles = (groups.get('') ?? []).sort((a, b) => {
    if (a.key === 'README.md') return -1
    if (b.key === 'README.md') return 1
    return a.title.localeCompare(b.title)
  })
  for (const node of rootFiles) {
    items.push({ key: node.key, label: node.key === 'README.md' ? 'Introduction' : node.title })
  }

  // A submenu per folder.
  for (const folder of orderedFolders) {
    const files = groups.get(folder)!.sort((a, b) => a.title.localeCompare(b.title))
    items.push({
      key: `group:${folder}`,
      label: prettify(folder),
      children: files.map((n) => ({ key: n.key, label: n.title })),
    })
  }

  return items
})()

/** Resolve a relative markdown link (from a doc) to a doc key, or null if external. */
export function resolveDocLink(fromKey: string, href: string): string | null {
  if (/^https?:\/\//i.test(href) || href.startsWith('#')) return null
  const clean = href.replace(/^\.\//, '').split('#')[0]
  if (!clean.endsWith('.md')) return null
  const baseDir = fromKey.includes('/') ? fromKey.slice(0, fromKey.lastIndexOf('/')) : ''
  const parts = (baseDir ? baseDir.split('/') : []).concat(clean.split('/'))
  const stack: string[] = []
  for (const p of parts) {
    if (p === '..') stack.pop()
    else if (p !== '.') stack.push(p)
  }
  const resolved = stack.join('/')
  return docsByKey[resolved] ? resolved : null
}
