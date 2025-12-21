import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function LandingPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get('/listings', {
          params: { page: 1, limit: 8 },
        });
        if (!cancelled) {
          setListings(res.data?.data?.listings ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load listings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] md:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Connect buyers and sellers of recyclable waste.
          </h1>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Cleannect helps you list, discover, and trade recyclable materials with verified
            partners. Manage your listings, orders, and communication from a single dashboard.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-xs text-slate-600 shadow-sm">
          <p className="mb-2 font-semibold text-slate-900">Live marketplace snapshot</p>
          <p className="mb-4 text-slate-600">
            Recently listed recyclable materials from your network.
          </p>
          {loading ? (
            <p className="text-slate-500">Loading listings...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : listings.length === 0 ? (
            <p className="text-slate-500">No listings yet. Be the first to create one.</p>
          ) : (
            <ul className="space-y-2">
              {listings.map((listing) => (
                <li
                  key={listing._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{listing.title}</div>
                    <div className="text-[11px] text-slate-600">
                      {listing.quantity} {listing.unit} • {listing.category}
                    </div>
                  </div>
                  <Link
                    to={`/listing/${listing._id}`}
                    className="text-xs font-medium text-emerald-600 hover:underline"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;






