import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../lib/apiClient';

const quickLinks = [
  { to: '/dashboard/listings/new', icon: '➕', label: 'New Listing',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { to: '/dashboard/orders',        icon: '🛍️', label: 'View Orders',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { to: '/dashboard/offers',        icon: '💰', label: 'My Offers',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { to: '/dashboard/messages',      icon: '💬', label: 'Messages',     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { to: '/dashboard/analytics',     icon: '📊', label: 'Analytics',    color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { to: '/dashboard/wishlist',      icon: '🤍', label: 'Wishlist',     color: 'bg-pink-50 text-pink-700 border-pink-200' },
];

function StatCard({ icon, label, value, sub, colorClass }) {
  return (
    <div className={`card p-5 flex items-start gap-4 fade-in`}>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiClient.get('/analytics/me')
      .then((res) => setStats(res.data?.data))
      .catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Hero greeting */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white shadow-md">
        <p className="text-emerald-100 text-sm font-medium">{greeting()}</p>
        <h1 className="mt-1 text-2xl font-bold">{user?.name} 👋</h1>
        <p className="mt-1 text-sm text-emerald-100">
          Here's a snapshot of your Cleannect activity today.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition"
        >
          🛒 Browse Marketplace
        </Link>
      </div>

      {/* Quick stats */}
      {stats && (
        <div>
          <h2 className="section-title mb-4">Your Stats</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="📦" label="Active Listings" value={stats.listings?.byStatus?.available}  colorClass="bg-emerald-50 text-emerald-600" />
            <StatCard icon="🛍️" label="Total Orders"   value={stats.orders?.total}                  colorClass="bg-blue-50 text-blue-600" />
            <StatCard icon="💵" label="Total Revenue"  value={`₹${(stats.revenue?.total ?? 0).toLocaleString()}`} colorClass="bg-amber-50 text-amber-600" />
            <StatCard icon="⭐" label="Rating"         value={user?.rating ? user.rating.toFixed(1) : 'N/A'} sub={user?.totalRatings ? `${user.totalRatings} reviews` : null} colorClass="bg-purple-50 text-purple-600" />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="section-title mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className={`card card-hover flex flex-col items-center gap-2 p-4 text-center border ${q.color} transition`}
            >
              <span className="text-2xl">{q.icon}</span>
              <span className="text-xs font-semibold">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      {stats?.recentOrders?.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-sm text-emerald-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="card overflow-hidden">
            <ul className="divide-y divide-slate-50">
              {stats.recentOrders.slice(0, 5).map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      <img
                        src={o.listing?.images?.[0] || '/plastic.webp'}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.src = '/plastic.webp'; }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{o.listing?.title}</p>
                      <p className="text-xs text-slate-500">{o.buyer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge status-${o.status}`}>{o.status}</span>
                    <span className="text-sm font-bold text-slate-900">₹{o.totalPrice}</span>
                    <Link to={`/dashboard/orders/${o._id}`} className="text-xs text-emerald-600 hover:underline font-medium">View</Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHomePage;
