import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const roleOptions = [
  { value: '', label: 'Buyer & seller' },
  { value: 'buyer', label: 'As buyer' },
  { value: 'seller', label: 'As seller' },
];

function OrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Potentially we may get here from a listing detail \"Create order\" button in the future.
    void location; // currently unused, but kept for expansion.
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/orders', {
          params: {
            status: status || undefined,
            role: role || undefined,
          },
        });
        if (!cancelled) {
          setOrders(res.data?.data?.orders ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load orders.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status, role]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          View orders where you are the buyer or seller, and track their status.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none ring-emerald-500 focus:ring-1"
          >
            <option value="">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none ring-emerald-500 focus:ring-1"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-lg border bg-white text-sm shadow-sm">
        {loading ? (
          <div className="p-4 text-slate-600">Loading orders...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-slate-600">No orders found.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Listing</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Buyer</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Seller</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Quantity</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Total</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-3 py-2 text-slate-900">{order.listing?.title}</td>
                  <td className="px-3 py-2 text-slate-700">{order.buyer?.name}</td>
                  <td className="px-3 py-2 text-slate-700">{order.seller?.name}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {order.quantity} {order.listing?.unit}
                  </td>
                  <td className="px-3 py-2 text-slate-700">₹{order.totalPrice}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] capitalize text-slate-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/dashboard/orders/${order._id}`}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;


