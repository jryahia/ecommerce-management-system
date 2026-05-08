import { ORDER_STATUS_CONFIG, OrderStatus } from '@/utils/constants'

interface StatusBadgeProps {
  status: string
  type?: 'order' | 'product' | 'user'
}

const PRODUCT_STATUS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
}

const USER_STATUS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700'
  let label = status

  if (type === 'order') {
    const config = ORDER_STATUS_CONFIG[status as OrderStatus]
    if (config) {
      colorClass = config.color
      label = config.label
    }
  } else if (type === 'product') {
    colorClass = PRODUCT_STATUS[status] ?? colorClass
    label = status.charAt(0).toUpperCase() + status.slice(1)
  } else if (type === 'user') {
    colorClass = USER_STATUS[status] ?? colorClass
    label = status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
