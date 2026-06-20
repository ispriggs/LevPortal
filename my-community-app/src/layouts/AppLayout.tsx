import { Outlet } from 'react-router-dom'
import BottomNav from '@/components/ui/BottomNav'
import GlobalToast from '@/components/GlobalToast'

export default function AppLayout() {
  return (
    <div
      className="flex flex-col w-full max-w-md md:max-w-3xl lg:max-w-6xl mx-auto bg-white"
      style={{ minHeight: '100dvh' }}
    >
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
      <GlobalToast />
    </div>
  )
}
