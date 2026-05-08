import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import api from '@/api/client'
import StatusBadge from '@/components/StatusBadge'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency, formatDate, getInitials } from '@/utils/formatters'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: boolean
  total_orders: number
  total_spent: number
  last_order_date: string
  created_at: string
  recentOrders: Array<{
    id: string
    order_number: string
    status: string
    total_amount: number
    created_at: string
  }>
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: customer, isLoading } = useQuery<Customer>(
    ['customer', id],
    () => api.get(`/customers/${id}`).then(r => r.data)
  )

  if (isLoading || !customer) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Customer since {formatDate(customer.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile */}
        <div className="md:col-span-1 card p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold mb-4">
            {getInitials(customer.first_name, customer.last_name)}
          </div>
          <h2 className="font-bold text-gray-900 text-lg">
            {customer.first_name} {customer.last_name}
          </h2>
          <StatusBadge status={customer.is_active ? 'active' : 'inactive'} type="user" />
          <div className="mt-4 space-y-2 w-full text-left">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{customer.total_orders}</p>
            <p className="text-xs text-gray-500 mt-1">Total Orders</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(customer.total_spent)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Spent</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-sm font-bold text-gray-900">
              {formatDate(customer.last_order_date)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last Order</p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">Order History</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customer.recentOrders?.map(o => (
              <tr
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-semibold text-gray-900">{o.order_number}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={o.status} type="order" />
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {formatCurrency(o.total_amount)}
                </td>
                <td className="px-6 py-4 text-right text-gray-500 text-xs">
                  {formatDate(o.created_at)}
                </td>
              </tr>
            ))}
            {(!customer.recentOrders || customer.recentOrders.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
