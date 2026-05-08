export const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-orange-100 text-orange-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
} as const;

export const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export const ITEMS_PER_PAGE = 10;
