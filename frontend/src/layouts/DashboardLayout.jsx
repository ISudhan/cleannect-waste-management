import { Link, NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '🏠', label: 'Dashboard', end: true },
      { to: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
    ],
  },
  {
    label: 'Trade',
    items: [
      { to: '/dashboard/listings', icon: '📦', label: 'My Listings' },
      { to: '/dashboard/orders', icon: '🛍️', label: 'Orders' },
      { to: '/dashboard/offers', icon: '💰', label: 'Offers' },
      { to: '/dashboard/wishlist', icon: '🤍', label: 'Wishlist' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { to: '/dashboard/messages', icon: '💬', label: 'Messages' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/profile', icon: '👤', label: 'Profile' },
    ],
  },
];

function Sidebar({ unreadCount, user, logout }) {
  return (
    <aside className="flex w-64 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm">C</div>
        <span className="text-lg font-bold text-slate-900">Cleannect</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Notifications separately for badge */}
        <div>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Alerts</p>
          <NavLink
            to="/dashboard/notifications"
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <span className="text-base">🔔</span>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="mb-2.5 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-secondary w-full py-2 text-xs text-slate-500"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar unreadCount={unreadCount} user={user} logout={logout} />
      </div>

      {/* Mobile drawer */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSideOpen(false)} />
          <div className="relative w-64 flex-shrink-0">
            <Sidebar unreadCount={unreadCount} user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setSideOpen(true)} className="text-slate-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-base font-bold text-slate-900">Cleannect</span>
          <Link to="/dashboard/notifications" className="relative text-slate-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
