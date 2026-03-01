import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../auth/AuthContext';
import LocationPicker from '../../components/LocationPicker';
import LocationMap from '../../components/LocationMap';

const steps = ['Cart', 'Delivery', 'Review', 'Done'];

function CheckoutPage() {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=Delivery, 1=Review
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [creatingOrders, setCreatingOrders] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth/login'); return; }
    if (user.address && typeof user.address === 'object') {
      setShippingAddress({
        street: user.address.street || '',
        city: user.address.city || '',
        state: user.address.state || '',
        zipCode: user.address.zipCode || '',
        country: user.address.country || 'India',
      });
      if (user.address.city) {
        setDeliveryLocation({
          city: user.address.city,
          state: user.address.state,
          country: user.address.country || 'India',
        });
      }
    }
  }, [user, navigate]);

  if (!user) return null;

  if (!cart?.items?.length) {
    return (
      <div className="empty-state min-h-[50vh]">
        <p className="empty-state-icon">🛒</p>
        <p className="font-semibold text-slate-700">Your cart is empty</p>
        <button type="button" onClick={() => navigate('/')} className="btn-primary mt-3">Browse Marketplace</button>
      </div>
    );
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  // When user picks a location on the map, sync form fields
  const handleMapPick = (info) => {
    setDeliveryLocation(info);
    setShippingAddress((prev) => ({
      ...prev,
      city: info.city || prev.city,
      state: info.state || prev.state,
      country: info.country || prev.country,
    }));
  };

  const total = cart.items.reduce((s, item) => {
    if (item.listing) s += item.listing.price * item.quantity;
    return s;
  }, 0);

  const handlePlaceOrder = async () => {
    setError('');
    setCreatingOrders(true);
    try {
      const addressToSend = {
        ...shippingAddress,
        lat: deliveryLocation?.lat,
        lng: deliveryLocation?.lng,
      };
      const results = await Promise.all(
        cart.items
          .filter((i) => i.listing)
          .map((item) =>
            apiClient.post('/orders', {
              listingId: item.listing._id,
              quantity: item.quantity,
              shippingAddress: addressToSend,
            })
          )
      );
      const orders = results.map((r) => r.data?.data?.order).filter(Boolean);
      if (!orders.length) throw new Error('Failed to create orders');
      await clearCart();
      navigate(orders.length === 1 ? `/dashboard/orders/${orders[0]._id}` : '/dashboard/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setCreatingOrders(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Stepper */}
      <div className="flex items-center gap-0">
        {['Delivery Address', 'Review & Place'].map((label, i) => (
          <div key={label} className="flex-1 flex items-center">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition ${i < step ? 'bg-emerald-600 border-emerald-600 text-white' : i === step ? 'border-emerald-600 text-emerald-600' : 'border-slate-200 text-slate-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:block text-sm font-semibold">{label}</span>
            </div>
            {i < 1 && <div className={`flex-1 h-0.5 mx-3 ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Step content */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Step 0: Delivery Address ── */}
          {step === 0 && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-lg">📍 Delivery Address</h2>
                <button
                  type="button"
                  onClick={() => setUseMapPicker(!useMapPicker)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${useMapPicker ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {useMapPicker ? '✓ Map mode on' : '🗺 Pick on map'}
                </button>
              </div>

              {/* Map Picker (Amazon-style) */}
              {useMapPicker && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Click on the map or search to set your delivery location:</p>
                  <LocationPicker value={deliveryLocation} onChange={handleMapPick} height="300px" />
                </div>
              )}

              {/* Form fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Street / Landmark</label>
                  <input name="street" value={shippingAddress.street} onChange={handleAddressChange} className="input-field" placeholder="e.g. 12 MG Road, Near Metro" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">City <span className="text-red-400">*</span></label>
                  <input name="city" required value={shippingAddress.city} onChange={handleAddressChange} className="input-field" placeholder="Mumbai" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">State <span className="text-red-400">*</span></label>
                  <input name="state" required value={shippingAddress.state} onChange={handleAddressChange} className="input-field" placeholder="Maharashtra" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">PIN Code</label>
                  <input name="zipCode" value={shippingAddress.zipCode} onChange={handleAddressChange} className="input-field" placeholder="400001" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Country</label>
                  <input name="country" value={shippingAddress.country} onChange={handleAddressChange} className="input-field" />
                </div>
              </div>

              {/* Delivery location preview map */}
              {(shippingAddress.city || deliveryLocation?.lat) && !useMapPicker && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-medium">Delivery location preview:</p>
                  <LocationMap
                    location={{ city: shippingAddress.city, state: shippingAddress.state, country: shippingAddress.country, lat: deliveryLocation?.lat, lng: deliveryLocation?.lng }}
                    height="200px"
                    zoom={12}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={!shippingAddress.city || !shippingAddress.state}
                onClick={() => setStep(1)}
                className="btn-primary w-full py-3"
              >
                Continue to Review →
              </button>
            </div>
          )}

          {/* ── Step 1: Review ── */}
          {step === 1 && (
            <div className="card p-6 space-y-5">
              <h2 className="font-bold text-slate-900 text-lg">🧾 Review Your Order</h2>

              {/* Delivery address summary */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Delivering to</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {[shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.zipCode, shippingAddress.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button type="button" onClick={() => setStep(0)} className="text-xs text-emerald-600 font-semibold hover:underline">Edit</button>
                </div>
                {/* Mini map showing delivery pin */}
                {(shippingAddress.city || deliveryLocation?.lat) && (
                  <div className="mt-3">
                    <LocationMap
                      location={{ city: shippingAddress.city, state: shippingAddress.state, country: shippingAddress.country, lat: deliveryLocation?.lat, lng: deliveryLocation?.lng }}
                      height="160px"
                      zoom={12}
                    />
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {cart.items.filter((i) => i.listing).map((item) => (
                  <div key={item._id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-3">
                    <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {item.listing.images?.[0]
                        ? <img src={item.listing.images[0]} alt={item.listing.title} className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.listing.title}</p>
                      <p className="text-xs text-slate-500">{item.quantity} {item.listing.unit} × ₹{item.listing.price}</p>
                      {item.listing.location?.city && (
                        <p className="text-xs text-slate-400 mt-0.5">📍 Pickup: {item.listing.location.city}{item.listing.location.state ? `, ${item.listing.location.state}` : ''}</p>
                      )}
                    </div>
                    <p className="font-bold text-emerald-600">₹{(item.listing.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <button
                type="button"
                disabled={creatingOrders || cartLoading}
                onClick={handlePlaceOrder}
                className="btn-primary w-full py-3 text-base"
              >
                {creatingOrders
                  ? <><span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />Placing Order…</>
                  : `✅ Place Order — ₹${total.toFixed(0)}`}
              </button>

              <button type="button" onClick={() => setStep(0)} className="btn-secondary w-full py-2 text-sm">
                ← Edit Address
              </button>
            </div>
          )}
        </div>

        {/* Right: Sticky Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 card p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Order Summary</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cart.items.map((item) => {
                if (!item.listing) return null;
                return (
                  <div key={item._id} className="flex justify-between text-sm">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-slate-800 line-clamp-1">{item.listing.title}</p>
                      <p className="text-xs text-slate-400">{item.quantity} {item.listing.unit}</p>
                    </div>
                    <p className="font-semibold text-slate-900 flex-shrink-0">₹{(item.listing.price * item.quantity).toFixed(0)}</p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span><span>₹{total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Pickup & transport</span><span className="text-emerald-600">As agreed</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total</span><span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Listing pickup locations */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pickup Locations</p>
              {cart.items.filter((i) => i.listing?.location?.city).map((item) => (
                <div key={item._id} className="text-xs text-slate-600 flex items-center gap-1">
                  <span>📍</span>
                  <span className="font-medium">{item.listing.title.slice(0, 20)}…</span>
                  <span className="text-slate-400">— {item.listing.location.city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
