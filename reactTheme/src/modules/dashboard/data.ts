// Static/dummy data powering the dashboard widgets. Swap these for API calls
// (via TanStack Query) when a backend is available.

export const monthlyRevenueData = [
  { month: 'Oct 24', type: 'Received', value: 56000 },
  { month: 'Oct 24', type: 'Pending', value: 108000 },
  { month: 'Nov 24', type: 'Received', value: 94000 },
  { month: 'Nov 24', type: 'Pending', value: 145000 },
  { month: 'Dec 24', type: 'Received', value: 132000 },
  { month: 'Dec 24', type: 'Pending', value: 72000 },
  { month: 'Jan 25', type: 'Received', value: 56000 },
  { month: 'Jan 25', type: 'Pending', value: 108000 },
  { month: 'Feb 25', type: 'Received', value: 130000 },
  { month: 'Feb 25', type: 'Pending', value: 62000 },
  { month: 'Mar 25', type: 'Received', value: 130000 },
  { month: 'Mar 25', type: 'Pending', value: 108000 },
  { month: 'Apr 25', type: 'Received', value: 96000 },
  { month: 'Apr 25', type: 'Pending', value: 26000 },
  { month: 'May 25', type: 'Received', value: 76000 },
  { month: 'May 25', type: 'Pending', value: 84000 },
  { month: 'Jun 25', type: 'Received', value: 86000 },
  { month: 'Jun 25', type: 'Pending', value: 145000 },
]

export const channelShareData = [
  { type: 'Direct', value: 38 },
  { type: 'Referral', value: 26 },
  { type: 'Social', value: 21 },
  { type: 'Organic', value: 15 },
]

export const salesTrendData = [
  { date: 'Mon', value: 3200 },
  { date: 'Tue', value: 4100 },
  { date: 'Wed', value: 3800 },
  { date: 'Thu', value: 5200 },
  { date: 'Fri', value: 6100 },
  { date: 'Sat', value: 7400 },
  { date: 'Sun', value: 6800 },
]

export const recentOrders = [
  {
    id: 'ORD-1042',
    customer: 'Alicia Moss',
    product: 'Annual Plan',
    amount: 480,
    status: 'Paid',
    date: '2025-06-21',
  },
  {
    id: 'ORD-1041',
    customer: 'Bryan Reed',
    product: 'Team Seats ×5',
    amount: 1250,
    status: 'Pending',
    date: '2025-06-21',
  },
  {
    id: 'ORD-1040',
    customer: 'Carmen Diaz',
    product: 'Monthly Plan',
    amount: 49,
    status: 'Paid',
    date: '2025-06-20',
  },
  {
    id: 'ORD-1039',
    customer: 'Derek Cole',
    product: 'Add-on Storage',
    amount: 120,
    status: 'Refunded',
    date: '2025-06-19',
  },
  {
    id: 'ORD-1038',
    customer: 'Elena Park',
    product: 'Annual Plan',
    amount: 480,
    status: 'Paid',
    date: '2025-06-18',
  },
]
