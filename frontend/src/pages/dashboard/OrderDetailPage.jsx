import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const nextStatusesByRole = {
  buyer: ['delivered', 'cancelled'],
  seller: ['confirmed', 'shipped', 'cancelled'],
};

function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/orders/${id}`);
      setOrder(res.data?.data?.order ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    setError('');
    try {
      await apiClient.put(`/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-600">Loading order...</div>;
  }

  if (!order) {
    return <div className="text-sm text-red-600">{error || 'Order not found.'}</div>;
  }

  const allowedStatuses = new Set(
    [...(nextStatusesByRole.buyer || []), ...(nextStatusesByRole.seller || [])],
  );

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Order detail</h1>
        <p className="mt-1 text-sm text-slate-600">Track the status and participants.</p>
      </header>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <section className="space-y-3 rounded-lg border bg-white p-4 text-sm shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Listing</h2>
            <p className="mt-1 text-slate-800">{order.listing?.title}</p>
            <p className="text-xs text-slate-600">{order.listing?.description}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-700">
            <span>
              Quantity: {order.quantity} {order.listing?.unit}
            </span>
            <span>Total: ₹{order.totalPrice}</span>
            <span>Status: {order.status}</span>
          </div>
        </section>
        <aside className="space-y-3 rounded-lg border bg-white p-4 text-sm shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Participants</h2>
            <div className="mt-2 grid gap-3 text-xs text-slate-700 md:grid-cols-2">
              <div>
                <div className="font-medium text-slate-800">Buyer</div>
                <p>{order.buyer?.name}</p>
                <p>{order.buyer?.email}</p>
              </div>
              <div>
                <div className="font-medium text-slate-800">Seller</div>
                <p>{order.seller?.name}</p>
                <p>{order.seller?.email}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Update status</h2>
            <p className="mt-1 text-xs text-slate-600">
              Allowed transitions depend on whether you are the buyer or seller.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...allowedStatuses].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus(s)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                >
                  Set {s}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default OrderDetailPage;


