// Dummy user directory + roles. A real implementation would fetch these.
export const dummyRoles = [
  'Administrator',
  'Editor',
  'Manager',
  'Viewer',
  'Support',
]

export const dummyUsers = [
  {
    id: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    roles: ['Administrator'],
    created_at: '2025-01-12',
  },
  {
    id: 2,
    name: 'Mark Spencer',
    email: 'mark@example.com',
    roles: ['Editor', 'Manager'],
    created_at: '2025-02-03',
  },
  {
    id: 3,
    name: 'Lucia Gomez',
    email: 'lucia@example.com',
    roles: ['Viewer'],
    created_at: '2025-02-20',
  },
  {
    id: 4,
    name: 'Tom Becker',
    email: 'tom@example.com',
    roles: [],
    created_at: '2025-03-15',
  },
  {
    id: 5,
    name: 'Priya Nair',
    email: 'priya@example.com',
    roles: ['Manager'],
    created_at: '2025-04-01',
  },
  {
    id: 6,
    name: 'Owen Clark',
    email: 'owen@example.com',
    roles: ['Support', 'Viewer'],
    created_at: '2025-04-18',
  },
  {
    id: 7,
    name: 'Hana Suzuki',
    email: 'hana@example.com',
    roles: ['Editor'],
    created_at: '2025-05-09',
  },
  {
    id: 8,
    name: 'Diego Torres',
    email: 'diego@example.com',
    roles: [],
    created_at: '2025-05-22',
  },
]
