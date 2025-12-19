import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get(`/listings/${id}`);
        if (!cancelled) {
          setListing(res.data?.data?.listing ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load listing.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading listing...</div>;
  }

  if (error || !listing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error || 'Listing not found.'}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-medium text-emerald-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">{listing.title}</h1>
        <p className="text-sm text-slate-700">{listing.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            {listing.category}
          </span>
          <span>
            Quantity: {listing.quantity} {listing.unit}
          </span>
          <span>Price: ₹{listing.price}</span>
          {listing.location?.city && (
            <span>
              Location: {listing.location.city}
              {listing.location.state ? `, ${listing.location.state}` : ''}
            </span>
          )}
        </div>
        {listing.images?.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
            {listing.images.map((img) => (
              <img
                key={img}
                src={img}
                alt={listing.title}
                className="h-28 w-full rounded-md object-cover"
              />
            ))}
          </div>
        )}
      </div>
      <aside className="space-y-4 rounded-lg border bg-white p-4 text-sm shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Seller</h2>
          <p className="mt-1 text-xs text-slate-700">{listing.seller?.name}</p>
          <p className="text-xs text-slate-600">{listing.seller?.email}</p>
          {listing.seller?.phone && (
            <p className="text-xs text-slate-600">Phone: {listing.seller.phone}</p>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() =>
              navigate('/dashboard/messages', {
                state: { receiverId: listing.seller?._id, listingId: listing._id },
              })
            }
            className="flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
          >
            Contact seller
          </button>
          <button
            type="button"
            onClick={() =>
              navigate('/dashboard/orders', {
                state: { fromListingId: listing._id },
              })
            }
            className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Create order
          </button>
        </div>
      </aside>
    </div>
  );
}

export default ListingDetailPage;



