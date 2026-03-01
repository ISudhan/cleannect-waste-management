import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import LocationMap from '../../components/LocationMap';

const statusFlow = ['pending', 'confirmed', 'shipped', 'delivered'];
const statusTransitions = {
  pending:   { buyer: ['cancelled'],          seller: ['confirmed', 'cancelled'] },
  confirmed: { buyer: ['cancelled'],          seller: ['shipped', 'cancelled']   },
  shipped:   { buyer: ['delivered'],          seller: []                          },
  delivered: { buyer: [],                     seller: []                          },
  cancelled: { buyer: [],                     seller: []                          },
};

const statusColors = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped:   'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const statusEmoji = { pending: '⏳', confirmed: '✅', shipped: '🚚', delivered: '📦', cancelled: '❌' };

function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
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

  useEffect(() => { load(); }, [id]);

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

  if (loading) return <div className="empty-state"><div className="spinner mx-auto" /></div>;
  if (!order || !user) return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'Order not found.'}</div>;

  const isBuyer = String(order.buyer?._id) === String(user.id);
  const isSeller = String(order.seller?._id) === String(user.id);
  const currentStatus = order.status;
  const myRole = isBuyer ? 'buyer' : isSeller ? 'seller' : null;
  const allowedStatuses = myRole ? [...new Set(statusTransitions[currentStatus]?.[myRole] || [])] : [];

  const currentStep = statusFlow.indexOf(currentStatus);

  // Pickup = listing location; Delivery = shipping address on order
  const pickupLocation = order.listing?.location;
  const deliveryLocation = order.shippingAddress;

  return (
    <div className="space-y-5 fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Order Details</h1>
          <p className="section-subtitle text-xs font-mono">#{order._id?.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-bold capitalize ${statusColors[currentStatus] || 'bg-slate-50 text-slate-600'}`}>
          {statusEmoji[currentStatus]} {currentStatus}
        </span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Order Timeline */}
      {currentStatus !== 'cancelled' && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Order Timeline</h2>
          <div className="flex items-center">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm border-2 font-bold transition ${i <= currentStep ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
                    {i < currentStep ? '✓' : statusEmoji[s]}
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold capitalize ${i <= currentStep ? 'text-emerald-600' : 'text-slate-400'}`}>{s}</span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Listing info */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Item</h2>
          <div className="flex gap-3">
            {order.listing?.images?.[0] ? (
              <img src={order.listing.images[0]} alt={order.listing.title} className="h-16 w-16 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">♻️</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm line-clamp-2">{order.listing?.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{order.listing?.category}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-base font-extrabold text-emerald-600">₹{order.totalPrice}</span>
                <span className="text-xs text-slate-400">/ {order.quantity} {order.listing?.unit}</span>
              </div>
            </div>
          </div>
          <Link to={`/listing/${order.listing?._id}`} className="text-xs font-semibold text-emerald-600 hover:underline">
            View Listing →
          </Link>
        </div>

        {/* Participants */}
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Participants</h2>
          <div className="space-y-3">
            {[
              { role: 'Buyer', person: order.buyer, isMe: isBuyer },
              { role: 'Seller', person: order.seller, isMe: isSeller },
            ].map(({ role, person, isMe }) => (
              <div key={role} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {person?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {person?.name} {isMe && <span className="text-xs text-emerald-600 font-medium">(You)</span>}
                  </p>
                  <p className="text-xs text-slate-400">{role} · {person?.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maps: Pickup + Delivery */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pickup Location (OLX-style: where seller is) */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            📦 Pickup Location
          </h2>
          {pickupLocation?.city || pickupLocation?.lat ? (
            <>
              <LocationMap
                location={{ city: pickupLocation.city, state: pickupLocation.state, country: pickupLocation.country, lat: pickupLocation.lat, lng: pickupLocation.lng }}
                height="200px"
                zoom={12}
              />
              <p className="mt-2 text-xs text-slate-500">
                {[pickupLocation.city, pickupLocation.state].filter(Boolean).join(', ')}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 h-32 text-slate-400 text-sm">
              📍 Seller hasn't shared location
            </div>
          )}
        </div>

        {/* Delivery Location (Amazon-style: where buyer wants it) */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            🚚 Delivery Address
          </h2>
          {deliveryLocation?.city ? (
            <>
              <LocationMap
                location={{ city: deliveryLocation.city, state: deliveryLocation.state, country: deliveryLocation.country, lat: deliveryLocation.lat, lng: deliveryLocation.lng }}
                height="200px"
                zoom={12}
              />
              <p className="mt-2 text-xs text-slate-500">
                {[deliveryLocation.street, deliveryLocation.city, deliveryLocation.state, deliveryLocation.zipCode].filter(Boolean).join(', ')}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 h-32 text-slate-400 text-sm">
              🏠 Delivery address not set
            </div>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {allowedStatuses.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Update Status</h2>
          <p className="text-xs text-slate-500 mb-3">
            You are the <strong className="text-slate-700">{myRole}</strong> in this order. You can:
          </p>
          <div className="flex flex-wrap gap-2">
            {allowedStatuses.map((s) => (
              <button
                key={s}
                type="button"
                disabled={updating}
                onClick={() => updateStatus(s)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition disabled:opacity-50 ${
                  s === 'cancelled'
                    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {statusEmoji[s]} Mark as {s}
              </button>
            ))}
          </div>
          {updating && <p className="mt-2 text-xs text-slate-400">Updating…</p>}
        </div>
      )}

      {/* Message Seller/Buyer button */}
      <div className="flex gap-3">
        {isBuyer && order.seller && (
          <Link
            to={`/dashboard/messages/${order.seller._id}`}
            className="btn-secondary py-2.5 px-5 flex items-center gap-2 text-sm"
          >
            💬 Message Seller
          </Link>
        )}
        {isSeller && order.buyer && (
          <Link
            to={`/dashboard/messages/${order.buyer._id}`}
            className="btn-secondary py-2.5 px-5 flex items-center gap-2 text-sm"
          >
            💬 Message Buyer
          </Link>
        )}
        <Link to="/dashboard/orders" className="btn-secondary py-2.5 px-5 text-sm">
          ← All Orders
        </Link>
      </div>
    </div>
  );
}

export default OrderDetailPage;
