import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { renderWithProviders, screen, waitFor } from '../test/test-utils'
import { useUrlTable, validateTableSearch } from './DataTable'

// A tiny page that surfaces the hook's params + the bound search box, so a test
// can drive the input and read back what would be sent to the server.
function Probe() {
  const table = useUrlTable(15, 'Search…')
  return (
    <div>
      <div data-testid="params">{JSON.stringify(table.params)}</div>
      {table.searchInput}
    </div>
  )
}

/** Build a single-route memory router whose route validates the table search. */
function makeRouter(initial = '/') {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Probe,
    validateSearch: validateTableSearch,
  })
  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: [initial] }),
  })
}

function readParams() {
  return JSON.parse(screen.getByTestId('params').textContent || '{}')
}

describe('validateTableSearch', () => {
  it('is empty for a bare URL (defaults are omitted, not serialized)', () => {
    expect(validateTableSearch({})).toEqual({})
  })

  it('keeps only non-default, well-formed params', () => {
    expect(validateTableSearch({ page: '3', per_page: '25', q: 'ann', sort_by: 'name', sort_dir: 'asc' })).toEqual({
      page: 3,
      per_page: 25,
      q: 'ann',
      sort_by: 'name',
      sort_dir: 'asc',
    })
    // Page 1 and the default page size are dropped; a stray direction is too.
    expect(validateTableSearch({ page: '1', per_page: '15', q: 'ann', sort_dir: 'asc' })).toEqual({ q: 'ann' })
    // Malformed numbers are ignored entirely.
    expect(validateTableSearch({ page: '-2', per_page: 'x' })).toEqual({})
  })
})

describe('useUrlTable', () => {
  it('derives params from the URL query string', async () => {
    renderWithProviders(<RouterProvider router={makeRouter('/?page=2&q=ann&sort_by=name&sort_dir=desc')} />)

    await waitFor(() =>
      expect(readParams()).toEqual({
        page: 2,
        per_page: 15,
        search: 'ann',
        sort_by: 'name',
        sort_dir: 'desc',
      }),
    )
    // The box is seeded from the URL.
    expect(screen.getByPlaceholderText('Search…')).toHaveValue('ann')
  })

  it('writes the debounced search to the URL and resets to page 1', async () => {
    const router = makeRouter('/?page=3')
    renderWithProviders(<RouterProvider router={router} />)

    await waitFor(() => expect(readParams().page).toBe(3))

    await userEvent.type(screen.getByPlaceholderText('Search…'), 'ann')

    await waitFor(() => {
      const p = readParams()
      expect(p.search).toBe('ann')
      expect(p.page).toBe(1) // a new search always returns to the first page
    })
    // The term is mirrored into the query string (as `q`), not left in local
    // state. `searchStr` is the raw serialized URL — defaults are dropped there,
    // so a searched-but-first-page table shows a tidy `?q=ann`.
    expect(router.state.location.searchStr).toContain('q=ann')
    expect(router.state.location.searchStr).not.toContain('page=')
  })
})
