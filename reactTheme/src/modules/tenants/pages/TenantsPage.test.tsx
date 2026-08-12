import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../../test/test-utils'
import TenantsPage from './TenantsPage'

// Mock the data layer — the page and its drawer both pull from ../queries.
vi.mock('../queries', () => ({
  useTenants: () => ({
    data: {
      data: [
        {
          id: 'acme',
          name: 'Acme Corp',
          status: 'active',
          email: null,
          phone: null,
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          domains: ['acme.localhost'],
          database: 'tenantacme',
          admin_name: 'Administrator',
          admin_email: 'admin@acme.test',
          created_at: '2026-07-23 14:08:49',
          updated_at: '2026-07-23 14:08:49',
        },
      ],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
    },
    isLoading: false,
  }),
  useDeleteTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useSetTenantStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTenant: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('TenantsPage', () => {
  it('renders every tenant field in the table', () => {
    renderWithProviders(<TenantsPage />)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('acme.localhost')).toBeInTheDocument()
    expect(screen.getByText('tenantacme')).toBeInTheDocument()
    expect(screen.getByText('admin@acme.test')).toBeInTheDocument()
  })

  it('opens the Create Tenant drawer on a SINGLE click', async () => {
    renderWithProviders(<TenantsPage />)

    // "Organization name" only exists inside the drawer's form, so it is a
    // reliable open/closed signal — the Drawer title is a div, not a heading.
    expect(screen.queryByText('Organization name')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Create Tenant/ }))

    await waitFor(() => expect(screen.getByText('Organization name')).toBeInTheDocument())
  })
})
