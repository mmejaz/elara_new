import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../test/test-utils'
import PageHeader from './PageHeader'

describe('PageHeader', () => {
  it('renders the title and subtitle', () => {
    renderWithProviders(<PageHeader title="Users" subtitle="Manage users" />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Manage users')).toBeInTheDocument()
  })

  it('renders the extra action slot', () => {
    renderWithProviders(<PageHeader title="Users" extra={<button>Add User</button>} />)

    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
  })
})
