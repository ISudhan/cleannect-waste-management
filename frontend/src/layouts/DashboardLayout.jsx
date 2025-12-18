import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/dashboard/listings', label: 'My Listings' },
  { to: '/dashboard/orders', label: 'Orders' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' },
];

function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 flex-col border-r bg-white md:flex">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-emerald-600">
            Cleannect
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2 rounded-md px-3 py-2',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-700 hover:bg-slate-100',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t px-4 py-3 text-xs text-slate-600">
          <div className="mb-1 font-medium">{user?.name}</div>
          <div className="mb-2">{user?.email}</div>
          <button
            onClick={logout}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 text-sm md:hidden">
          <Link to="/" className="text-base font-semibold text-emerald-600">
            Cleannect
          </Link>
          <span className="text-xs text-slate-600">{user?.email}</span>
        </header>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;


