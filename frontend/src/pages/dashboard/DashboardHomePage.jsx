import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back, {user?.name}. Manage your listings, orders, and conversations here.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/dashboard/listings"
          className="rounded-lg border bg-white p-4 text-sm shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Listings
          </p>
          <p className="mt-2 text-slate-800">
            View and manage the waste listings you&apos;ve created as a seller.
          </p>
        </Link>
        <Link
          to="/dashboard/orders"
          className="rounded-lg border bg-white p-4 text-sm shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Orders</p>
          <p className="mt-2 text-slate-800">
            Track orders as a buyer and seller, and keep statuses up to date.
          </p>
        </Link>
        <Link
          to="/dashboard/messages"
          className="rounded-lg border bg-white p-4 text-sm shadow-sm hover:border-emerald-200 hover:bg-emerald-50/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Messages
          </p>
          <p className="mt-2 text-slate-800">
            Continue conversations with trading partners about specific listings.
          </p>
        </Link>
      </section>
    </div>
  );
}

export default DashboardHomePage;


