import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const PRIMARY = '#243d20'

export default function ProtectedRoute() {
  const { isAuthenticated, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ backgroundColor: '#f0f0ec' }}>
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent border-t-current animate-spin"
          style={{ color: PRIMARY }}
        />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
