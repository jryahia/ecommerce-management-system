import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api from '@/api/client'
import DataTable, { Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: string
  total_amount: number
  items_count: number
  created_at: string
}

interface OrdersResponse {
  orders: Order[]
  pagination: { page: number; pages: number; total: number; limit: number }
}

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export default function Orders() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery<OrdersResponse>(
    ['orders', page, search, status],
    () =>
      api
        .get('/orders', { params: { page, limit: ITEMS_PER_PAGE, search, status } })
        .then(r => r.data),
    { keepPreviousData: true }
  )

  const columns: Column<Order>[] = [
    {
      header: 'Order',
      render: o => (
        <div>
          <p className="font-semibold text-gray-900">{o.order_number}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(o.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: o => (
        <div>
          <p className="font-medium text-gray-900">{o.customer_name}</p>
          <p className="text-xs text-gray-500 truncate max-w-40">{o.customer_email}</p>
        </div>
      ),
    },
    {
      header: 'Items',
      render: o => (
        <span className="text-gray-600">
          {o.items_count} item{Number(o.items_count) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      header: 'Status',
      render: o => <StatusBadge status={o.status} type="order" />,
    },
    {
      header: 'Total',
      render: o => <span className="font-semibold text-gray-900">{formatCurrency(o.total_amount)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination.total ?? 0} orders total</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by order # or customer..."
            className="input pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-auto min-w-44"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.orders ?? []}
          keyExtractor={o => o.id}
          loading={isLoading}
          emptyMessage="No orders found"
          pagination={data?.pagination}
          onPageChange={setPage}
          onRowClick={o => navigate(`/orders/${o.id}`)}
        />
      </div>
    </div>
  )
}
