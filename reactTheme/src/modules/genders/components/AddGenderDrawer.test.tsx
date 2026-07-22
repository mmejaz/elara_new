import { describe, expect, it, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../../test/test-utils'
import AddGenderDrawer from './AddGenderDrawer'

const createMutate = vi.fn()

// Mock the data layer so the drawer renders without a real API.
vi.mock('../queries', () => ({
  useCreateGender: () => ({ mutate: createMutate, isPending: false }),
}))

// Seed Redux so the drawer is open.
const openState = {
  genders: { addDrawerOpen: true, editDrawerOpen: false, editing: null },
}

describe('AddGenderDrawer', () => {
  beforeEach(() => createMutate.mockClear())

  it('renders the form with the instruction card', () => {
    renderWithProviders(<AddGenderDrawer />, { preloadedState: openState })

    expect(screen.getByText('Add Gender')).toBeInTheDocument()
    expect(screen.getByText('Before you start')).toBeInTheDocument()
    expect(screen.getByText(/are required/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  it('marks the name field as required', () => {
    renderWithProviders(<AddGenderDrawer />, { preloadedState: openState })

    // AntD renders the asterisk via a `.ant-form-item-required` label. The Drawer
    // renders in a portal, so query the document rather than the render container.
    expect(document.querySelector('.ant-form-item-required')).toBeInTheDocument()
  })

  it('blocks submit and shows a validation error when empty', async () => {
    renderWithProviders(<AddGenderDrawer />, { preloadedState: openState })

    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Enter a name')).toBeInTheDocument()
    expect(createMutate).not.toHaveBeenCalled()
  })

  it('submits the entered name', async () => {
    renderWithProviders(<AddGenderDrawer />, { preloadedState: openState })

    await userEvent.type(screen.getByPlaceholderText('Enter name'), 'Male')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1))
    expect(createMutate.mock.calls[0][0]).toEqual({ name: 'Male' })
  })
})
