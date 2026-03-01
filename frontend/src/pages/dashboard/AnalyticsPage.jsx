import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Link } from 'react-router-dom';

function StatCard({ label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span className="truncate">{label}</span>
        <span>₹{value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/analytics/me')
      .then((res) => setData(res.data?.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="py-12 text-center text-slate-500">Loading analytics…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const { listings, orders, revenue, topListings, recentOrders } = data;
  const maxRevenue = revenue.trend.length > 0 ? Math.max(...revenue.trend.map((d) => d.revenue)) : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Seller Analytics</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Listings" value={listings.total} color="blue" />
        <StatCard label="Total Revenue" value={`₹${revenue.total.toLocaleString()}`} color="emerald" />
        <StatCard label="Orders Received" value={orders.total} color="amber" />
        <StatCard
          label="Delivered"
          value={orders.byStatus.delivered ?? 0}
          sub={`${orders.byStatus.cancelled ?? 0} cancelled`}
          color="rose"
        />
      </div>

      {/* Listing Status Breakdown */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Listings by Status</h2>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {Object.entries(listings.byStatus).map(([status, count]) => (
            <div key={status} className="rounded-lg bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="capitalize text-slate-500">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend */}
      {revenue.trend.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Revenue — Last 7 Days</h2>
          <div className="space-y-2">
            {revenue.trend.map((d) => (
              <MiniBar key={d._id} label={d._id} value={d.revenue} max={maxRevenue} />
            ))}
          </div>
        </div>
      )}

      {/* Top Listings */}
      {topListings.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Top Listings by Orders</h2>
          <ul className="divide-y">
            {topListings.map((item) => (
              <li key={item._id} className="flex items-center gap-3 py-3">
                <img
                  src={item.listing?.images?.[0] || '/plastic.webp'}
                  alt={item.listing?.title}
                  className="h-10 w-10 rounded-lg object-cover"
                  onError={(e) => { e.target.src = '/plastic.webp'; }}
                />
                <div className="flex-1 truncate">
                  <p className="truncate font-medium text-slate-900">{item.listing?.title}</p>
                  <p className="text-xs text-slate-500">{item.orderCount} orders · ₹{item.revenue.toLocaleString()} revenue</p>
                </div>
                <Link
                  to={`/listing/${item._id}`}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-900">Recent Orders</h2>
          <ul className="divide-y">
            {recentOrders.map((o) => (
              <li key={o._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{o.listing?.title}</p>
                  <p className="text-xs text-slate-500">Buyer: {o.buyer?.name} · ₹{o.totalPrice}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                  o.status === 'delivered' ? 'bg-green-100 text-green-700'
                  : o.status === 'cancelled' ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {o.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
