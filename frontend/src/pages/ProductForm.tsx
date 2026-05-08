import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import api from '@/api/client'
import LoadingSpinner, { PageLoader } from '@/components/LoadingSpinner'

interface Category {
  id: string
  name: string
}

interface ProductFormData {
  name: string
  sku: string
  categoryId: string
  price: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  description: string
  isActive: boolean
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({ defaultValues: { isActive: true } })

  const { data: categories } = useQuery<Category[]>('categories', () =>
    api.get('/categories').then(r => r.data)
  )

  const { data: product, isLoading: loadingProduct } = useQuery(
    ['product', id],
    () => api.get(`/products/${id}`).then(r => r.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (product) {
      reset({
        name: product.name ?? '',
        sku: product.sku ?? '',
        categoryId: product.category_id ?? '',
        price: product.price ?? 0,
        costPrice: product.cost_price ?? 0,
        stockQuantity: product.stock_quantity ?? 0,
        minStockLevel: product.min_stock_level ?? 0,
        description: product.description ?? '',
        isActive: product.is_active ?? true,
      })
    }
  }, [product, reset])

  const mutation = useMutation(
    (data: ProductFormData) =>
      isEdit
        ? api.put(`/products/${id}`, data).then(r => r.data)
        : api.post('/products', data).then(r => r.data),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Product updated!' : 'Product created!')
        qc.invalidateQueries('products')
        navigate('/products')
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        toast.error(msg ?? 'Something went wrong')
      },
    }
  )

  if (isEdit && loadingProduct) return <PageLoader />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? 'Update product details' : 'Add a new product to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input
                className="input"
                placeholder="e.g. Wireless Headphones"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">SKU *</label>
              <input
                className="input"
                placeholder="e.g. WH-001"
                {...register('sku', { required: 'SKU is required' })}
              />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="label">Category</label>
              <select className="input" {...register('categoryId')}>
                <option value="">— Select category —</option>
                {(categories ?? []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Product description..."
                {...register('description')}
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="section-title">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
                {...register('price', {
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be >= 0' },
                  valueAsNumber: true,
                })}
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="label">Cost Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
                {...register('costPrice', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="0"
                {...register('stockQuantity', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="label">Min Stock Level</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="0"
                {...register('minStockLevel', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Product is visible and available for orders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('isActive')} />
              <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isLoading} className="btn-primary">
            {mutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
