import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 flex">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 ${
              isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
