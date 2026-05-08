import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Dashboard', exact: true },
  { path: '/products', icon: CubeIcon, label: 'Products' },
  { path: '/orders', icon: ShoppingBagIcon, label: 'Orders' },
  { path: '/customers', icon: UsersIcon, label: 'Customers' },
  { path: '/analytics', icon: ChartBarIcon, label: 'Analytics' },
  { path: '/settings', icon: Cog6ToothIcon, label: 'Settings' },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <ShoppingBagIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg leading-tight">EcomAdmin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white lg:hidden">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === path : location.pathname.startsWith(path)
          return (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">EcomAdmin v1.0</p>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 rounded-lg text-white shadow-lg"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
