import { Outlet, Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotifications } from '../contexts/NotificationContext';

function PublicLayout() {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { unreadCount } = useNotifications();
  const cartCount = getCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="page-container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">C</span>
            Cleannect
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              🛒 Marketplace
            </NavLink>

            {user ? (
              <>
                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link
                  to="/dashboard/notifications"
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  className="ml-1 btn-primary py-2 px-4 text-sm"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/auth/login" className="btn-secondary py-2 px-4 text-sm">
                  Log in
                </Link>
                <Link to="/auth/register" className="btn-primary py-2 px-4 text-sm">
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            className="flex md:hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm text-slate-600"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 space-y-1 md:hidden fade-in">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">🛒 Marketplace</Link>
            {user ? (
              <>
                <Link to="/cart" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cart {cartCount > 0 && `(${cartCount})`}</Link>
                <Link to="/dashboard/notifications" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Notifications {unreadCount > 0 && `(${unreadCount})`}</Link>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">Dashboard</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Log out</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Log in</Link>
                <Link to="/auth/register" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">Sign up</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <div className="page-container py-6">
          <Outlet />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Cleannect — Marketplace for recyclable waste materials
      </footer>
    </div>
  );
}

export default PublicLayout;
