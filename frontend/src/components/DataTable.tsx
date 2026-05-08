import type { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export interface Column<T> {
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface Pagination {
  page: number
  pages: number
  total: number
  limit: number
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  pagination?: Pagination
  onPageChange?: (page: number) => void
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading,
  emptyMessage = 'No data found',
  pagination,
  onPageChange,
}: DataTableProps<T>) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={`bg-white hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {(() => {
              const windowSize = Math.min(pagination.pages, 5)
              const half = Math.floor(windowSize / 2)
              const start = Math.max(1, Math.min(pagination.page - half, pagination.pages - windowSize + 1))
              return Array.from({ length: windowSize }, (_, i) => {
                const p = start + i
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      p === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                )
              })
            })()}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
