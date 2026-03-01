import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useWishlist } from '../../contexts/WishlistContext';

function WishlistPage() {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/wishlist');
      setItems(res.data?.data?.wishlist?.listings ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (listingId) => {
    await toggleWishlist(listingId);
    setItems((prev) => prev.filter((i) => (i.listing?._id ?? i.listing) !== listingId));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Wishlist</h1>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-4xl">🤍</p>
          <p className="mt-2 text-slate-500">Your wishlist is empty</p>
          <Link to="/" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const l = item.listing;
            if (!l) return null;
            const id = l._id;
            return (
              <div key={id} className="group relative overflow-hidden rounded-xl border bg-white transition hover:shadow-md">
                <button
                  onClick={() => handleRemove(id)}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-1.5 text-rose-500 shadow-sm backdrop-blur hover:bg-white"
                  title="Remove from wishlist"
                >
                  ♥
                </button>
                <Link to={`/listing/${id}`}>
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={l.images?.[0] || '/plastic.webp'}
                      alt={l.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.target.src = '/plastic.webp'; }}
                    />
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-2 font-semibold text-slate-900 group-hover:text-emerald-600">
                      {l.title}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      ₹{l.price}
                      <span className="text-xs font-normal text-slate-500">/{l.unit}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {l.quantity} {l.unit} available · {l.location?.city || 'Unknown city'}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
