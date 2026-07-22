import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../../test/test-utils'
import GendersPage from './GendersPage'

const deleteMutate = vi.fn()
const useGendersSpy = vi.fn()

// Mock the data layer — the page + its drawers all pull from ../queries.
vi.mock('../queries', () => ({
  useGenders: (params: unknown) => {
    useGendersSpy(params)
    return {
      data: {
        data: [
          { id: 1, name: 'Male', created_at: '2026-01-01' },
          { id: 2, name: 'Female', created_at: '2026-01-02' },
        ],
        meta: { current_page: 1, per_page: 15, total: 2, last_page: 1 },
      },
      isLoading: false,
    }
  },
  useDeleteGender: () => ({ mutate: deleteMutate, isPending: false }),
  useCreateGender: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateGender: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('GendersPage', () => {
  it('renders the header, search and Add button', () => {
    renderWithProviders(<GendersPage />)

    expect(screen.getByRole('heading', { name: 'Genders' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search Genders…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Gender/ })).toBeInTheDocument()
  })

  it('renders the rows returned by the server', () => {
    renderWithProviders(<GendersPage />)

    expect(screen.getByText('Male')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
  })

  it('requests the first page with the default page size', () => {
    renderWithProviders(<GendersPage />)

    expect(useGendersSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 15 }),
    )
  })

  it('debounces the search term before querying the server', async () => {
    renderWithProviders(<GendersPage />)
    useGendersSpy.mockClear()

    await userEvent.type(screen.getByPlaceholderText('Search Genders…'), 'ma')

    // Typing must not fire a request per keystroke…
    expect(useGendersSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ search: 'm' }),
    )
    // …only the settled value is sent.
    await waitFor(
      () =>
        expect(useGendersSpy).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'ma' }),
        ),
      { timeout: 2000 },
    )
  })

  it('opens the Add drawer from the header button', async () => {
    const { store } = renderWithProviders(<GendersPage />)

    expect(store.getState().genders.addDrawerOpen).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: /Add Gender/ }))
    expect(store.getState().genders.addDrawerOpen).toBe(true)
  })
})
