import { useEffect, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate, useRouterState } from '@tanstack/react-router'
import { useModuleTree } from '../hooks/useModuleTree'
import type { Module } from '../types/models'

/**
 * Routes reachable regardless of module visibility: self-service pages and the
 * safe fallback a blocked user is sent to.
 */
const ALWAYS_ALLOWED = new Set(['profile'])

/** Collect every slug in the (visible-only) module tree, groups + items, recursively. */
function collectSlugs(tree: Module[] = [], acc = new Set<string>()): Set<string> {
  for (const node of tree) {
    if (node.slug) acc.add(node.slug)
    if (node.children?.length) collectSlugs(node.children, acc)
  }
  return acc
}

/**
 * Enforces module visibility on direct navigation. `/modules/tree` returns only
 * VISIBLE modules, so a route whose slug is absent from that tree is a module
 * that was hidden in Managed Modules — we bounce the user to a visible page
 * instead of rendering it. Without this, hiding a module only removed its
 * sidebar entry while the URL still worked (e.g. /dashboard).
 *
 * Fails OPEN until the tree has data, so a slow or failed /modules/tree fetch
 * never locks the user out of every page.
 */
function ModuleAccessGuard({ children }: { children: ReactNode }) {
  const { data: tree } = useModuleTree()
  const location = useLocation()
  const navigate = useNavigate()

  // Whether the current URL matched the catch-all 404 route (path '$') rather
  // than a real page. A typo isn't a hidden module — let it fall through to the
  // NotFound page instead of redirecting it.
  const isNotFound = useRouterState({
    select: (s) => (s.matches[s.matches.length - 1]?.routeId ?? '').endsWith('$'),
  })

  const visible = useMemo(() => collectSlugs(tree), [tree])
  const slug = location.pathname.replace(/^\/+/, '').split('/')[0]

  // No tree yet (initial load, no cache) → don't block anything.
  const ready = visible.size > 0
  const blocked =
    ready &&
    slug.length > 0 &&
    !isNotFound && //           a real registered page…
    !ALWAYS_ALLOWED.has(slug) &&
    !visible.has(slug) //       …whose module was hidden in Managed Modules

  useEffect(() => {
    if (!blocked) return
    // Dashboard is the usual home; if it's what's hidden, fall back to profile
    // (always allowed, always routed).
    navigate({ to: visible.has('dashboard') ? '/dashboard' : '/profile', replace: true })
  }, [blocked, navigate, visible])

  // Render nothing while the redirect is in flight to avoid flashing the page.
  if (blocked) return null

  return <>{children}</>
}

export default ModuleAccessGuard
