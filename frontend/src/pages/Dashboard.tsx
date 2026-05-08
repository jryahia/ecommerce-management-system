import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import api from '@/api/client'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface DashboardStats {
  stats: {
    totalSales: { current: number; previous: number; change: string | number }
    totalOrders: { current: number; previous: number; change: string | number }
    totalProducts: number
    totalCustomers: number
  }
  recentOrders: Array<{
    id: string
    order_number: string
    customer_name: string
    total_amount: number
    status: string
    created_at: string
  }>
  topProducts: Array<{ name: string; sku: string; total_sold: number; total_revenue: number }>
  salesChart: Array<{ date: string; sales: number; orders: number }>
  lowStockProducts: Array<{
    name: string
    sku: string
    stock_quantity: number
    min_stock_level: number
  }>
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<DashboardStats>('dashboard', () =>
    api.get('/analytics/dashboard').then(r => r.data)
  )

  if (isLoading || !data) return <PageLoader />

  const { stats, recentOrders, topProducts, salesChart, lowStockProducts } = data

  const chartData = salesChart.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: Number(d.sales),
    orders: Number(d.orders),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back — here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalSales.current)}
          change={stats.totalSales.change}
          icon={CurrencyDollarIcon}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          index={0}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.current}
          change={stats.totalOrders.change}
          icon={ShoppingBagIcon}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          index={1}
        />
        <StatsCard
          title="Active Customers"
          value={stats.totalCustomers}
          icon={UsersIcon}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          index={2}
        />
        <StatsCard
          title="Active Products"
          value={stats.totalProducts}
          icon={CubeIcon}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 card p-6">
          <h2 className="section-title mb-4">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#salesGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            <h2 className="section-title">Low Stock Alerts</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">All products are well stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(p => (
                <div
                  key={p.sku}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-orange-600">{p.stock_quantity}</p>
                    <p className="text-xs text-gray-400">of {p.min_stock_level} min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="section-title">Recent Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{order.customer_name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={order.status} type="order" />
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="section-title">Top Products This Month</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topProducts.map((p, i) => (
              <div key={p.sku} className="flex items-center gap-4 px-6 py-3.5">
                <span className="w-6 text-sm font-bold text-gray-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(p.total_revenue)}
                  </p>
                  <p className="text-xs text-gray-400">{p.total_sold} units</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
