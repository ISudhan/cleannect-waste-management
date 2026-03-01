import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const STATUS_TABS = ['', 'available', 'sold', 'archived'];

const STATUS_COLORS = {
  available: 'badge-green',
  sold:      'badge-red',
  archived:  'badge-slate',
};

function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/listings/seller/my-listings', {
          params: { status: status || undefined },
        });
        if (!cancelled) setListings(res.data?.data?.listings ?? []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load your listings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [status]);

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">My Listings</h1>
          <p className="section-subtitle">Manage your recyclable waste listings.</p>
        </div>
        <Link to="/dashboard/listings/new" className="btn-primary">
          + New Listing
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
              status === s
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty-state card">
          <div className="spinner mx-auto" />
          <p className="text-sm text-slate-400 mt-2">Loading listings…</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-sm text-red-600">{error}</div>
      ) : listings.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-state-icon">📦</p>
          <p className="text-base font-semibold text-slate-700">No listings yet</p>
          <p className="text-sm text-slate-400">Create your first listing to start selling recyclable waste.</p>
          <Link to="/dashboard/listings/new" className="btn-primary mt-2">Create Listing</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing._id} className="card card-hover overflow-hidden group">
              {/* Image */}
              <div className="aspect-video overflow-hidden bg-slate-100">
                <img
                  src={listing.images?.[0] || '/plastic.webp'}
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => { e.target.src = '/plastic.webp'; }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{listing.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{listing.category}</p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[listing.status] || 'badge-slate'} flex-shrink-0 capitalize`}>
                    {listing.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">₹{listing.price}</p>
                    <p className="text-xs text-slate-400">per {listing.unit} · {listing.quantity} available</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/listing/${listing._id}`}
                      className="btn-secondary py-1.5 px-3 text-xs"
                      title="View listing"
                    >
                      View
                    </Link>
                    <Link
                      to={`/dashboard/listings/${listing._id}/edit`}
                      className="btn-primary py-1.5 px-3 text-xs"
                      title="Edit listing"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListingsPage;
