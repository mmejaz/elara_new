import type { MenuProps } from 'antd'

/**
 * Loads every markdown file bundled under ./content as a raw string (Vite glob),
 * then splits it into two independent guides by top-level folder:
 *
 *   ./content/developer-guide/**  → the technical/developer documentation
 *   ./content/user-guide/**       → the end-user "how to use the app" guide
 *
 * The guide prefix is stripped from each doc key, so a doc's internal relative
 * links (e.g. ../design-patterns/frontend.md) keep resolving unchanged.
 *
 * The content is a copy of the repo's /docs (developer) and /user-guide (user).
 * Re-copy after editing:
 *   Copy-Item docs\*        ...\content\developer-guide -Recurse -Force
 *   Copy-Item user-guide\*  ...\content\user-guide      -Recurse -Force
 */
const raw = import.meta.glob('./content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface DocNode {
  key: string // guide-relative path, e.g. "architecture/backend.md"
  title: string
  content: string
}

export interface Guide {
  docsByKey: Record<string, DocNode>
  menuItems: MenuProps['items']
  defaultKey: string
  resolveDocLink: (fromKey: string, href: string) => string | null
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

function folderRank(folder: string): [number, string] {
  const num = folder.match(/^(\d+)/)
  return num ? [Number(num[1]), folder] : [9000, folder]
}

/** Build one self-contained guide from the content files under `content/<prefix>/`. */
function createGuide(prefix: string): Guide {
  const root = `./content/${prefix}/`

  const docsByKey: Record<string, DocNode> = {}
  for (const [full, content] of Object.entries(raw)) {
    if (!full.startsWith(root)) continue
    const path = full.slice(root.length)
    docsByKey[path] = { key: path, title: titleOf(content, prettify(path)), content }
  }

  // Group by top-level folder ("" = guide-root files like README.md).
  const groups = new Map<string, DocNode[]>()
  for (const node of Object.values(docsByKey)) {
    const slash = node.key.indexOf('/')
    const folder = slash === -1 ? '' : node.key.slice(0, slash)
    if (!groups.has(folder)) groups.set(folder, [])
    groups.get(folder)!.push(node)
  }

  const orderedFolders = [...groups.keys()]
    .filter((f) => f !== '')
    .sort((a, b) => {
      const [na, sa] = folderRank(a)
      const [nb, sb] = folderRank(b)
      return na - nb || sa.localeCompare(sb)
    })

  const defaultKey = docsByKey['README.md']?.key ?? Object.keys(docsByKey)[0] ?? ''

  const menuItems: MenuProps['items'] = (() => {
    const items: NonNullable<MenuProps['items']> = []

    const rootFiles = (groups.get('') ?? []).sort((a, b) => {
      if (a.key === 'README.md') return -1
      if (b.key === 'README.md') return 1
      return a.title.localeCompare(b.title)
    })
    for (const node of rootFiles) {
      items.push({ key: node.key, label: node.key === 'README.md' ? 'Introduction' : node.title })
    }

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

  const resolveDocLink = (fromKey: string, href: string): string | null => {
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

  return { docsByKey, menuItems, defaultKey, resolveDocLink }
}

export const developerGuide = createGuide('developer-guide')
export const userGuide = createGuide('user-guide')
