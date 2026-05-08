import { useState } from 'react'
import { useQuery } from 'react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api from '@/api/client'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { PERIODS } from '@/utils/constants'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface SalesData {
  salesByDay: Array<{ date: string; sales: number; orders: number }>
  salesByStatus: Array<{ status: string; count: number; total: number }>
  salesByPayment: Array<{ payment_method: string; count: number; total: number }>
}

interface ProductData {
  topSelling: Array<{ name: string; sku: string; total_sold: number; total_revenue: number; avg_price: number }>
  byCategory: Array<{ category_name: string; product_count: number; total_sold: number }>
  lowStock: Array<{ name: string; sku: string; stock_quantity: number; min_stock_level: number; shortage: number }>
}

interface CustomerData {
  newCustomers: Array<{ date: string; new_customers: number }>
  topCustomers: Array<{ name: string; email: string; total_orders: number; total_spent: number }>
  segments: Array<{ segment: string; count: number }>
}

export default function Analytics() {
  const [period, setPeriod] = useState('30d')

  const { data: salesData, isLoading: loadingSales } = useQuery<SalesData>(
    ['analytics-sales', period],
    () => api.get('/analytics/sales', { params: { period } }).then(r => r.data)
  )

  const { data: productData, isLoading: loadingProducts } = useQuery<ProductData>(
    ['analytics-products', period],
    () => api.get('/analytics/products', { params: { period } }).then(r => r.data)
  )

  const { data: customerData, isLoading: loadingCustomers } = useQuery<CustomerData>(
    ['analytics-customers', period],
    () => api.get('/analytics/customers', { params: { period } }).then(r => r.data)
  )

  const isLoading = loadingSales || loadingProducts || loadingCustomers
  if (isLoading) return <PageLoader />

  const salesChartData = (salesData?.salesByDay ?? []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: Number(d.sales),
    orders: Number(d.orders),
  }))

  const newCustomersData = (customerData?.newCustomers ?? []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    customers: Number(d.new_customers),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Sales and performance overview</p>
        </div>
        <select
          className="input w-auto"
          value={period}
          onChange={e => setPeriod(e.target.value)}
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sales Over Time */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={salesChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              contentStyle={{ borderRadius: '8px', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* New Customers */}
        <div className="card p-6">
          <h2 className="section-title mb-4">New Customers</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={newCustomersData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Category (pie) */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Revenue by Category</h2>
          {(productData?.byCategory ?? []).length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-16">No category data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={productData?.byCategory ?? []}
                  dataKey="total_sold"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category_name, percent }: { category_name: string; percent: number }) =>
                    `${category_name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(productData?.byCategory ?? []).map((_entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="section-title">Top Products by Revenue</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Units Sold</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(productData?.topSelling ?? []).map((p, i) => (
              <tr key={p.sku} className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-400">{i + 1}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">{formatNumber(p.total_sold)}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(p.total_revenue)}</td>
                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(p.avg_price)}</td>
              </tr>
            ))}
            {(productData?.topSelling ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No sales data for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="section-title mb-4">Customer Segments</h2>
          <div className="space-y-3">
            {(customerData?.segments ?? []).map(s => (
              <div key={s.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{s.segment}</span>
                <span className="text-lg font-bold text-primary-600">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="section-title">Top Customers</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {(customerData?.topCustomers ?? []).slice(0, 5).map(c => (
              <div key={c.email} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(c.total_spent)}</p>
                  <p className="text-xs text-gray-400">{c.total_orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
