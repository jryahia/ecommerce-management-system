import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import api from '@/api/client'
import StatusBadge from '@/components/StatusBadge'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency, formatDateTime } from '@/utils/formatters'

interface OrderItem {
  id: string
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  notes: string
  shipping_address: Record<string, string>
  billing_address: Record<string, string>
  items: OrderItem[]
  created_at: string
  shipped_at?: string
  delivered_at?: string
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery<Order>(
    ['order', id],
    () => api.get(`/orders/${id}`).then(r => r.data)
  )

  const statusMutation = useMutation(
    (status: string) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
    {
      onSuccess: (_data, status) => {
        toast.success(`Order ${status}`)
        qc.invalidateQueries(['order', id])
        qc.invalidateQueries('orders')
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(msg ?? 'Failed to update status')
      },
    }
  )

  if (isLoading || !order) return <PageLoader />

  const nextStatuses = STATUS_TRANSITIONS[order.status] ?? []

  const formatAddress = (addr: Record<string, string>) => {
    if (!addr) return '—'
    return [addr.street, addr.city, addr.state, addr.country, addr.zipCode]
      .filter(Boolean)
      .join(', ')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">{order.order_number}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} type="order" />
      </div>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Update status:</span>
          {nextStatuses.map(s => {
            const isCancel = s === 'cancelled'
            const isDeliver = s === 'delivered'
            const isShip = s === 'shipped'
            return (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isLoading}
                className={`btn text-sm flex items-center gap-2 ${
                  isCancel
                    ? 'btn-danger'
                    : isDeliver
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'btn-primary'
                }`}
              >
                {isShip && <TruckIcon className="h-4 w-4" />}
                {isDeliver && <CheckCircleIcon className="h-4 w-4" />}
                {isCancel && <XCircleIcon className="h-4 w-4" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer</h3>
          <p className="font-semibold text-gray-900">{order.customer_name}</p>
          <p className="text-sm text-gray-500 mt-1">{order.customer_email}</p>
          {order.customer_phone && (
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
          )}
        </div>

        {/* Shipping */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shipping Address</h3>
          <p className="text-sm text-gray-700">{formatAddress(order.shipping_address)}</p>
          {order.shipped_at && (
            <p className="text-xs text-gray-500 mt-2">Shipped: {formatDateTime(order.shipped_at)}</p>
          )}
          {order.delivered_at && (
            <p className="text-xs text-gray-500">Delivered: {formatDateTime(order.delivered_at)}</p>
          )}
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-900 capitalize">{order.payment_method ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={order.payment_status ?? 'pending'} type="order" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">Order Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items?.map(item => (
              <tr key={item.id} className="bg-white">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{item.product_sku}</p>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                <td className="px-6 py-4 text-right text-gray-600">{item.quantity}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (10%)</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatCurrency(order.shipping_amount)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="card p-5">
          <h3 className="section-title mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  )
}
