import { Outlet } from 'react-router-dom'
import BottomNav from '@/components/ui/BottomNav'

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-svh max-w-md mx-auto bg-white">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
