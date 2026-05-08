import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBg?: string
  index?: number
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50',
  index = 0,
}: StatsCardProps) {
  const changeNum = change !== undefined ? Number(change) : null
  const isPositive = changeNum !== null && changeNum >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {changeNum !== null && (
            <div className={`mt-1 flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? (
                <ArrowUpIcon className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownIcon className="h-3.5 w-3.5" />
              )}
              <span>{Math.abs(changeNum).toFixed(1)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  )
}
