import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    shippingAddress: '',
  });
  const [creatingOrder, setCreatingOrder] = useState(false);

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

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth/login');
      return;
    }

    setCreatingOrder(true);
    setError('');
    try {
      const res = await apiClient.post('/orders', {
        listingId: listing._id,
        quantity: parseFloat(orderForm.quantity),
        shippingAddress: orderForm.shippingAddress || undefined,
      });
      const order = res.data?.data?.order;
      if (order) {
        navigate(`/dashboard/orders/${order._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setCreatingOrder(false);
    }
  };

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
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {!showOrderForm ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/auth/login');
                  return;
                }
                navigate('/dashboard/messages', {
                  state: { receiverId: listing.seller?._id, listingId: listing._id },
                });
              }}
              className="flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
            >
              Contact seller
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/auth/login');
                  return;
                }
                if (listing.seller?._id === user.id || listing.seller?._id?.toString() === user.id) {
                  setError('You cannot order your own listing.');
                  return;
                }
                setShowOrderForm(true);
                setOrderForm({ quantity: '', shippingAddress: '' });
              }}
              className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Create order
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateOrder} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="text-xs font-medium text-slate-700">
                Quantity (max: {listing.quantity} {listing.unit})
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0.01"
                max={listing.quantity}
                step="0.01"
                required
                value={orderForm.quantity}
                onChange={handleOrderFormChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none ring-emerald-500 focus:ring-1"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="shippingAddress" className="text-xs font-medium text-slate-700">
                Shipping Address (optional)
              </label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                rows={3}
                value={orderForm.shippingAddress}
                onChange={handleOrderFormChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs outline-none ring-emerald-500 focus:ring-1"
                placeholder="Leave empty to use your profile address"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowOrderForm(false);
                  setError('');
                }}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingOrder}
                className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {creatingOrder ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}

export default ListingDetailPage;



