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
      <section className="grid gap-8 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] md:items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Connect buyers and sellers of recyclable waste.
          </h1>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            Cleannect helps you list, discover, and trade recyclable materials with verified
            partners. Manage your listings, orders, and communication from a single dashboard.
          </p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Live Marketplace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Recently listed recyclable materials from your network.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">Loading listings...</p>
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">No listings yet. Be the first to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {listings.map((listing) => {
                const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
                return (
                  <Link
                    key={listing._id}
                    to={`/listing/${listing._id}`}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-md"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={listing.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-slate-100">
                          <svg
                            className="h-12 w-12 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Status Badge */}
                      {listing.status && (
                        <div className="absolute top-2 right-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              listing.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : listing.status === 'sold'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {listing.status === 'available' ? 'Available' : listing.status}
                          </span>
                        </div>
                      )}
                      {/* Category Badge */}
                      {listing.category && (
                        <div className="absolute top-2 left-2">
                          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium capitalize text-slate-700 backdrop-blur-sm">
                            {listing.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
                        {listing.title}
                      </h3>
                      
                      {/* Price */}
                      <div className="mb-2 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900">₹{listing.price}</span>
                        <span className="text-xs text-slate-500">/{listing.unit}</span>
                      </div>

                      {/* Quantity & Location */}
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <span>
                            {listing.quantity} {listing.unit} available
                          </span>
                        </div>
                        {listing.location?.city && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="truncate">
                              {listing.location.city}
                              {listing.location.state ? `, ${listing.location.state}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
                          View Details
                        </span>
                        <svg
                          className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;






