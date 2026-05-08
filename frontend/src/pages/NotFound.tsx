import { useNavigate } from 'react-router-dom'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <ExclamationCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 text-lg mb-6">Page not found</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
