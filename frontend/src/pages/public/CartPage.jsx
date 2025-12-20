import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../auth/AuthContext';

function CartPage() {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600">Please log in to view your cart.</p>
        <Link
          to="/auth/login"
          className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (loading && !cart) {
    return <div className="text-sm text-slate-600">Loading cart...</div>;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
        <p className="text-sm text-slate-600">Your cart is empty.</p>
        <Link
          to="/"
          className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const handleQuantityChange = async (itemId, newQuantity) => {


    setUpdatingItems((prev) => new Set(prev).add(itemId));
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const calculateSubtotal = () => {
    if (!cart.items) return 0;
    return cart.items.reduce((total, item) => {
      if (item.listing && item.listing.price) {
        return total + item.listing.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => {
            if (!item.listing) return null;

            const listing = item.listing;
            const itemPrice = listing.price * item.quantity;
            const isUpdating = updatingItems.has(item._id.toString());
            const isRemoving = removingItems.has(item._id.toString());

            return (
              <div
                key={item._id}
                className="rounded-lg border bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    to={`/listing/${listing._id}`}
                    className="flex-shrink-0"
                  >
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-24 w-24 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-md bg-slate-100 flex items-center justify-center">
                        <span className="text-xs text-slate-400">No image</span>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/listing/${listing._id}`}
                          className="text-base font-semibold text-slate-900 hover:text-emerald-600"
                        >
                          {listing.title}
                        </Link>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                            {listing.category}
                          </span>
                          <span className="text-slate-600">
                            {listing.quantity} {listing.unit} available
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={isRemoving}
                        className="flex-shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title="Remove item"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`quantity-${item._id}`} className="text-sm text-slate-600">
                          Quantity:
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            disabled={isUpdating || isRemoving || item.quantity <= 0.01}
                            className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            −
                          </button>
                          <input
                            id={`quantity-${item._id}`}
                            type="number"
                            min="0.01"
                            max={listing.quantity}
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseFloat(e.target.value);
                              if (!isNaN(newQty) && newQty > 0) {
                                handleQuantityChange(item._id, newQty);
                              }
                            }}
                            disabled={isUpdating || isRemoving}
                            className="h-8 w-20 rounded border border-slate-300 px-2 text-center text-sm outline-none ring-emerald-500 focus:ring-1 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            disabled={
                              isUpdating ||
                              isRemoving ||
                              item.quantity >= listing.quantity
                            }
                            className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-slate-500">
                          {listing.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-slate-900">
                          ₹{itemPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">
                          ₹{listing.price} per {listing.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">Total:</span>
                  <span className="text-lg font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Proceed to Checkout
              </button>
              <Link
                to="/"
                className="block w-full rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;

