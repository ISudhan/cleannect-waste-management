import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const STATUS_COLORS = {
  pending:   'status-pending',
  confirmed: 'status-confirmed',
  shipped:   'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

const TAB_OPTIONS = [
  { value: '',       label: 'All' },
  { value: 'buyer',  label: 'As Buyer' },
  { value: 'seller', label: 'As Seller' },
];

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/orders', {
          params: { status: status || undefined, role: role || undefined },
        });
        if (!cancelled) setOrders(res.data?.data?.orders ?? []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [status, role]);

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Orders</h1>
          <p className="section-subtitle">Track your buying and selling activity.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Role tabs */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
          {TAB_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => setRole(t.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                role === t.value
                  ? 'bg-white shadow text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner mx-auto" />
          <p className="text-slate-500 text-sm mt-2">Loading orders…</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-state-icon">🛍️</p>
          <p className="text-base font-semibold text-slate-700">No orders found</p>
          <p className="text-sm text-slate-400">Try changing the filters or browse the marketplace to place an order.</p>
          <Link to="/" className="btn-primary mt-2">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center gap-4 p-4">
                {/* Listing image + title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={order.listing?.images?.[0] || '/plastic.webp'}
                      alt={order.listing?.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.src = '/plastic.webp'; }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{order.listing?.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>Qty: {order.quantity} {order.listing?.unit}</span>
                      <span>·</span>
                      <span>₹{order.totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="hidden sm:flex flex-col text-xs text-slate-500">
                  <span>Buyer: <span className="font-medium text-slate-700">{order.buyer?.name}</span></span>
                  <span>Seller: <span className="font-medium text-slate-700">{order.seller?.name}</span></span>
                </div>

                {/* Status + action */}
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_COLORS[order.status] ?? 'badge-slate'} capitalize`}>
                    {order.status}
                  </span>
                  <Link
                    to={`/dashboard/orders/${order._id}`}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
