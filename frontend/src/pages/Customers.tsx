import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api from '@/api/client'
import DataTable, { Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { formatCurrency, formatDate, getInitials } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  total_orders: number
  total_spent: number
  last_order_date: string
  is_active: boolean
  created_at: string
}

interface CustomersResponse {
  customers: Customer[]
  pagination: { page: number; pages: number; total: number; limit: number }
}

export default function Customers() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<CustomersResponse>(
    ['customers', page, search],
    () =>
      api
        .get('/customers', { params: { page, limit: ITEMS_PER_PAGE, search } })
        .then(r => r.data),
    { keepPreviousData: true }
  )

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      render: c => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
            {getInitials(c.first_name, c.last_name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {c.first_name} {c.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      render: c => <span className="text-gray-600">{c.phone ?? '—'}</span>,
    },
    {
      header: 'Orders',
      render: c => <span className="font-medium text-gray-900">{c.total_orders}</span>,
    },
    {
      header: 'Total Spent',
      render: c => <span className="font-semibold text-gray-900">{formatCurrency(c.total_spent)}</span>,
    },
    {
      header: 'Last Order',
      render: c => <span className="text-gray-500 text-xs">{formatDate(c.last_order_date)}</span>,
    },
    {
      header: 'Status',
      render: c => <StatusBadge status={c.is_active ? 'active' : 'inactive'} type="user" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">{data?.pagination.total ?? 0} customers total</p>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or email..."
            className="input pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.customers ?? []}
          keyExtractor={c => c.id}
          loading={isLoading}
          emptyMessage="No customers found"
          pagination={data?.pagination}
          onPageChange={setPage}
          onRowClick={c => navigate(`/customers/${c.id}`)}
        />
      </div>
    </div>
  )
}
