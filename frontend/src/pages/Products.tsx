import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import api from '@/api/client'
import DataTable, { Column } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import { formatCurrency } from '@/utils/formatters'
import { ITEMS_PER_PAGE } from '@/utils/constants'

interface Product {
  id: string
  name: string
  sku: string
  category_name: string
  price: number
  cost_price: number
  stock_quantity: number
  min_stock_level: number
  is_active: boolean
  created_at: string
}

interface ProductsResponse {
  products: Product[]
  pagination: { page: number; pages: number; total: number; limit: number }
}

function StockIndicator({ qty, min }: { qty: number; min: number }) {
  if (qty <= 0) return <span className="text-xs font-medium text-red-600">Out of Stock</span>
  if (qty <= min) return <span className="text-xs font-medium text-orange-500">Low ({qty})</span>
  return <span className="text-xs font-medium text-green-600">{qty} in stock</span>
}

export default function Products() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const { data, isLoading } = useQuery<ProductsResponse>(
    ['products', page, search, status],
    () =>
      api
        .get('/products', { params: { page, limit: ITEMS_PER_PAGE, search, status } })
        .then(r => r.data),
    { keepPreviousData: true }
  )

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/products/${id}`),
    {
      onSuccess: () => {
        toast.success('Product deleted')
        qc.invalidateQueries('products')
        setDeleteTarget(null)
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : 'Failed to delete product'
        toast.error(msg ?? 'Failed to delete product')
        setDeleteTarget(null)
      },
    }
  )

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      render: p => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          <p className="text-xs text-gray-500">{p.sku}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      render: p => <span className="text-gray-600">{p.category_name ?? '—'}</span>,
    },
    {
      header: 'Price',
      render: p => <span className="font-medium">{formatCurrency(p.price)}</span>,
    },
    {
      header: 'Stock',
      render: p => <StockIndicator qty={p.stock_quantity} min={p.min_stock_level} />,
    },
    {
      header: 'Status',
      render: p => <StatusBadge status={p.is_active ? 'active' : 'inactive'} type="product" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: p => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/products/${p.id}/edit`) }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.pagination.total ?? 0} products total
          </p>
        </div>
        <button onClick={() => navigate('/products/new')} className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or SKU..."
            className="input pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-auto min-w-36"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.products ?? []}
          keyExtractor={p => p.id}
          loading={isLoading}
          emptyMessage="No products found"
          pagination={data?.pagination}
          onPageChange={setPage}
          onRowClick={p => navigate(`/products/${p.id}/edit`)}
        />
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Product"
        size="sm"
      >
        <p className="text-gray-600 text-sm">
          Are you sure you want to delete{' '}
          <strong className="text-gray-900">{deleteTarget?.name}</strong>? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isLoading}
            className="btn-danger"
          >
            {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
