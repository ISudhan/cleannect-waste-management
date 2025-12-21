import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../contexts/CartContext';

function PublicLayout() {
  const { user } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-emerald-600">
            Cleannect
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/" className="text-slate-700 hover:text-emerald-600">
              Browse Listings
            </Link>
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="relative rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Cart
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Log in
                </Link>
                <Link
                  to="/auth/register"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default PublicLayout;


