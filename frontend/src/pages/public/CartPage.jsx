import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../auth/AuthContext';

const getCategoryFallbackImage = (category) => {
  const map = { plastic: '/plastic.webp', paper: '/paper.webp', metal: '/metal.webp', organic: '/organic.webp', electronic: '/electronic.webp', textile: '/textile.webp' };
  return map[category?.toLowerCase()] || '/plastic.webp';
};

function CartPage() {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  if (!user) {
    return (
      <div className="empty-state card max-w-md mx-auto mt-12">
        <p className="empty-state-icon">🔒</p>
        <p className="text-base font-semibold text-slate-700">Sign in to view your cart</p>
        <Link to="/auth/login" className="btn-primary mt-2">Log In</Link>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="empty-state">
        <div className="spinner mx-auto" />
        <p className="text-sm text-slate-400 mt-2">Loading cart…</p>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="empty-state card max-w-md mx-auto mt-12 fade-in">
        <p className="empty-state-icon">🛒</p>
        <p className="text-xl font-bold text-slate-900">Your cart is empty</p>
        <p className="text-sm text-slate-400">Add some recyclable waste materials to get started.</p>
        <Link to="/" className="btn-primary mt-2">Browse Marketplace</Link>
      </div>
    );
  }

  const handleQtyChange = async (itemId, newQty) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try { await updateQuantity(itemId, newQty); } catch { /* ignore */ }
    finally { setUpdatingItems((prev) => { const s = new Set(prev); s.delete(itemId); return s; }); }
  };

  const handleRemove = async (itemId) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    try { await removeFromCart(itemId); } catch { /* ignore */ }
    finally { setRemovingItems((prev) => { const s = new Set(prev); s.delete(itemId); return s; }); }
  };

  const subtotal = cart.items.reduce((sum, item) => {
    return item.listing?.price ? sum + item.listing.price * item.quantity : sum;
  }, 0);

  return (
    <div className="fade-in space-y-6">
      <h1 className="section-title">Shopping Cart <span className="text-slate-400 font-normal text-base ml-1">({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})</span></h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {cart.items.map((item) => {
            if (!item.listing) return null;
            const { listing } = item;
            const isUpdating = updatingItems.has(item._id?.toString());
            const isRemoving = removingItems.has(item._id?.toString());
            const lineTotal = listing.price * item.quantity;

            return (
              <div key={item._id} className={`card p-4 transition-opacity ${isRemoving ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/listing/${listing._id}`} className="flex-shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={listing.images?.[0] || getCategoryFallbackImage(listing.category)}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.src = getCategoryFallbackImage(listing.category); }}
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/listing/${listing._id}`} className="font-semibold text-slate-900 hover:text-emerald-600 line-clamp-1">
                          {listing.title}
                        </Link>
                        <span className="badge badge-green mt-1">{listing.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item._id)}
                        disabled={isRemoving || isUpdating}
                        className="flex-shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {/* Qty control */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item._id, item.quantity - 1)}
                          disabled={isUpdating || isRemoving || item.quantity <= 0.01}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0.01"
                          max={listing.quantity}
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) handleQtyChange(item._id, v); }}
                          disabled={isUpdating || isRemoving}
                          className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-center text-sm font-medium focus:border-emerald-400 focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item._id, item.quantity + 1)}
                          disabled={isUpdating || isRemoving || item.quantity >= listing.quantity}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                        >
                          +
                        </button>
                        <span className="text-xs text-slate-400">{listing.unit}</span>
                      </div>
                      {/* Line total */}
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₹{lineTotal.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">₹{listing.price}/{listing.unit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="self-start sticky top-4">
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Order Summary</h2>

            <div className="space-y-2 text-sm">
              {cart.items.map((item) => item.listing && (
                <div key={item._id} className="flex justify-between text-slate-600">
                  <span className="truncate mr-2">{item.listing.title}</span>
                  <span className="flex-shrink-0">₹{(item.listing.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-base">Total</span>
              <span className="text-xl font-bold text-emerald-600">₹{subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 text-base"
            >
              Proceed to Checkout →
            </button>
            <Link to="/" className="btn-secondary w-full py-2.5 text-sm text-center block">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
