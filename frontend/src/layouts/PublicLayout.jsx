import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function PublicLayout() {
  const { user } = useAuth();

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
              <Link
                to="/dashboard"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Dashboard
              </Link>
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


