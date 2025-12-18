import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

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
        if (!cancelled) {
          setListings(res.data?.data?.listings ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load your listings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My listings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage the recyclable waste listings you&apos;ve created.
          </p>
        </div>
        <Link
          to="/dashboard/listings/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          New listing
        </Link>
      </header>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-slate-700">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none ring-emerald-500 focus:ring-1"
        >
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="rounded-lg border bg-white text-sm shadow-sm">
        {loading ? (
          <div className="p-4 text-slate-600">Loading listings...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : listings.length === 0 ? (
          <div className="p-4 text-slate-600">
            You don&apos;t have any listings yet. Create your first listing to start selling.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Title</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Category</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Quantity</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Price</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((listing) => (
                <tr key={listing._id}>
                  <td className="px-3 py-2 text-slate-900">{listing.title}</td>
                  <td className="px-3 py-2 text-slate-700">{listing.category}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {listing.quantity} {listing.unit}
                  </td>
                  <td className="px-3 py-2 text-slate-700">₹{listing.price}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] capitalize text-slate-700">
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/dashboard/listings/${listing._id}/edit`}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Edit
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

export default MyListingsPage;


