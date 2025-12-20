import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../auth/AuthContext';

function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [creatingOrders, setCreatingOrders] = useState(false);
  const [error, setError] = useState('');
  const [createdOrderIds, setCreatedOrderIds] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    // Pre-fill shipping address from user profile
    if (user.address) {
      setShippingAddress({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || '',
        country: user.address.country || 'India',
      });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-600">Your cart is empty.</p>
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Go to Cart
        </button>
      </div>
    );
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    if (!cart.items) return 0;
    return cart.items.reduce((total, item) => {
      if (item.listing && item.listing.price) {
        return total + item.listing.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingOrders(true);

    try {
      const orderPromises = cart.items.map((item) => {
        if (!item.listing) return null;
        return apiClient.post('/orders', {
          listingId: item.listing._id,
          quantity: item.quantity,
          shippingAddress,
        });
      });

      const results = await Promise.all(orderPromises);
      const orders = results
        .filter((r) => r !== null)
        .map((r) => r.data?.data?.order)
        .filter((o) => o !== null);

      if (orders.length === 0) {
        throw new Error('Failed to create orders');
      }

      setCreatedOrderIds(orders.map((o) => o._id));

      // Clear cart
      await clearCart();

      // Navigate to first order detail page
      if (orders.length === 1) {
        navigate(`/dashboard/orders/${orders[0]._id}`);
      } else {
        // If multiple orders, navigate to orders page
        navigate('/dashboard/orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create orders. Please try again.');
    } finally {
      setCreatingOrders(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Form */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Shipping Address</h2>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-slate-700">
                  Street Address
                </label>
                <input
                  id="street"
                  name="street"
                  type="text"
                  value={shippingAddress.street}
                  onChange={handleAddressChange}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-700">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-slate-700">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    value={shippingAddress.zipCode}
                    onChange={handleAddressChange}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={creatingOrders || cartLoading}
                className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingOrders ? 'Creating Orders...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="space-y-3">
              {cart.items.map((item) => {
                if (!item.listing) return null;
                const itemPrice = item.listing.price * item.quantity;
                return (
                  <div key={item._id} className="flex items-start justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{item.listing.title}</div>
                      <div className="text-slate-600">
                        {item.quantity} {item.listing.unit} × ₹{item.listing.price}
                      </div>
                    </div>
                    <div className="ml-4 font-medium text-slate-900">₹{itemPrice.toFixed(2)}</div>
                  </div>
                );
              })}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900">Total:</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;

