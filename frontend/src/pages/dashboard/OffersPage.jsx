import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Link } from 'react-router-dom';

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            active ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

const statusColor = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
  expired: 'bg-slate-100 text-slate-500',
};

function OffersPage() {
  const [tab, setTab] = useState('seller'); // 'seller' = incoming, 'buyer' = outgoing
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/offers', { params: { role: tab } });
      setOffers(res.data?.data?.offers ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const respond = async (id, status) => {
    setActioning(id);
    try {
      await apiClient.put(`/offers/${id}/respond`, { status });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActioning(null);
    }
  };

  const cancel = async (id) => {
    setActioning(id);
    try {
      await apiClient.put(`/offers/${id}/cancel`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel offer');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Offers</h1>

      <div className="flex gap-2">
        <TabButton active={tab === 'seller'} onClick={() => setTab('seller')}>
          Received
        </TabButton>
        <TabButton active={tab === 'buyer'} onClick={() => setTab('buyer')}>
          Sent
        </TabButton>
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : offers.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-slate-500">No {tab === 'seller' ? 'received' : 'sent'} offers</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {offers.map((o) => (
            <li key={o._id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={o.listing?.images?.[0] || '/plastic.webp'}
                    alt={o.listing?.title}
                    className="h-14 w-14 rounded-lg object-cover"
                    onError={(e) => { e.target.src = '/plastic.webp'; }}
                  />
                  <div>
                    <Link
                      to={`/listing/${o.listing?._id}`}
                      className="font-semibold text-slate-900 hover:text-emerald-600"
                    >
                      {o.listing?.title}
                    </Link>
                    <p className="text-sm text-slate-600">
                      Offer: <span className="font-bold text-emerald-700">₹{o.offerPrice}</span>/{o.listing?.unit} ×{' '}
                      {o.quantity} {o.listing?.unit}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tab === 'seller' ? `From: ${o.buyer?.name}` : `To seller`}
                    </p>
                    {o.message && (
                      <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs italic text-slate-600">
                        "{o.message}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[o.status]}`}>
                    {o.status}
                  </span>
                  {tab === 'seller' && o.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        disabled={actioning === o._id}
                        onClick={() => respond(o._id, 'accepted')}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        disabled={actioning === o._id}
                        onClick={() => respond(o._id, 'rejected')}
                        className="rounded-md border px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {tab === 'buyer' && o.status === 'pending' && (
                    <button
                      disabled={actioning === o._id}
                      onClick={() => cancel(o._id)}
                      className="rounded-md border px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OffersPage;
