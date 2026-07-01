import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../../test/test-utils'
import AddUserDrawer from './AddUserDrawer'

const createMutate = vi.fn()

// Mock the data layer so the drawer renders without a real API.
vi.mock('../queries', () => ({
  useRoles: () => ({ data: ['Admin', 'Teacher'], isLoading: false }),
  useCreateUser: () => ({ mutate: createMutate, isPending: false }),
}))

// Seed Redux so the drawer is open.
const openState = {
  users: { addDrawerOpen: true, editDrawerOpen: false, editingUser: null },
}

describe('AddUserDrawer', () => {
  it('renders the form when open', () => {
    renderWithProviders(<AddUserDrawer />, { preloadedState: openState })

    expect(screen.getByText('Add New User')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('jane@example.com')).toBeInTheDocument()
  })

  it('blocks submit and shows validation errors when empty', async () => {
    renderWithProviders(<AddUserDrawer />, { preloadedState: openState })

    await userEvent.click(screen.getByRole('button', { name: 'Create User' }))

    expect(await screen.findByText("Enter the user's name")).toBeInTheDocument()
    expect(createMutate).not.toHaveBeenCalled()
  })
})
