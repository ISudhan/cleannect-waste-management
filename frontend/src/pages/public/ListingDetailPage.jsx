import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';

// Map categories to fallback images
const getCategoryFallbackImage = (category) => {
  const categoryImages = {
    plastic: '/plastic.webp',
    paper: '/paper.webp',
    metal: '/metal.webp',
    organic: '/organic.webp',
    electronic: '/electronic.webp',
    textile: '/textile.webp',
    // Default fallback for glass, other, or unknown categories
    default: '/plastic.webp',
  };
  return categoryImages[category?.toLowerCase()] || categoryImages.default;
};

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleQuantityChange = (delta) => {
    if (!listing) return;
    const newQuantity = Math.max(0.01, Math.min(listing.quantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleQuantityInput = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0 && value <= listing.quantity) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    if (listing.seller?._id === user.id || listing.seller?._id?.toString() === user.id) {
      setError('You cannot add your own listing to cart.');
      return;
    }

    setAddingToCart(true);
    setError('');
    setSuccessMessage('');

    try {
      await addToCart(listing._id, quantity);
      setSuccessMessage('Item added to cart successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add item to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    navigate('/dashboard/messages', {
      state: { receiverId: listing.seller?._id, listingId: listing._id },
    });
  };

  if (loading) {
    return <div className="text-sm text-slate-600">Loading listing...</div>;
  }

  if (error && !listing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{error}</p>
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

  if (!listing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Listing not found.</p>
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

  const images = listing.images && listing.images.length > 0 ? listing.images : [];
  const mainImage = images[selectedImageIndex] || (images.length > 0 ? images[0] : null);

  // Derive status for UI:
  // - If quantity is 0 or backend status is not "available" -> "Unavailable"
  // - Else if we have initialQuantity and remaining quantity is <= half of the original quantity -> "Selling fast"
  // - Else -> "Available"
  const remainingQuantity = listing.quantity != null ? parseFloat(listing.quantity) : 0;
  const initialQuantity = listing.initialQuantity != null ? parseFloat(listing.initialQuantity) : null;
  const listingStatus = listing.status || 'available';
  
  // Check if unavailable: quantity is 0 or less, or status is not 'available'
  const isUnavailable = isNaN(remainingQuantity) || remainingQuantity <= 0 || listingStatus !== 'available';
  
  // Check if selling fast: only if we have initialQuantity and remaining is > 0 and <= half of initial
  const isSellingFast = 
    !isUnavailable && 
    initialQuantity != null && 
    !isNaN(initialQuantity) && 
    initialQuantity > 0 && 
    remainingQuantity > 0 &&
    remainingQuantity <= initialQuantity / 2;

  const statusLabel = isUnavailable ? 'Unavailable' : isSellingFast ? 'Selling fast' : 'Available';
  const statusClasses = isUnavailable
    ? 'bg-slate-100 text-slate-700'
    : isSellingFast
      ? 'bg-amber-50 text-amber-700'
      : 'bg-green-50 text-green-700';

  return (
    <div className="space-y-6">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg border bg-white shadow-sm">
            <img
              src={mainImage || getCategoryFallbackImage(listing.category)}
              alt={listing.title}
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback to category image if the main image fails to load
                e.target.src = getCategoryFallbackImage(listing.category);
              }}
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-emerald-600 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${listing.title} ${index + 1}`}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      // Fallback to category image if the thumbnail image fails to load
                      e.target.src = getCategoryFallbackImage(listing.category);
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {listing.category}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}>
                {statusLabel}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{listing.title}</h1>
            <p className="mt-3 text-base text-slate-600">{listing.description}</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-3xl font-bold text-slate-900">₹{listing.price}</div>
              <div className="text-sm text-slate-600">per {listing.unit}</div>
            </div>

            <div className="mb-4 space-y-2 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Available Quantity:</span>
                <span className="font-medium text-slate-900">
                  {listing.quantity} {listing.unit}
                </span>
              </div>
              {listing.location?.city && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium text-slate-900">
                    {listing.location.city}
                    {listing.location.state ? `, ${listing.location.state}` : ''}
                  </span>
                </div>
              )}
            </div>

            {listing.status === 'available' && (
              <>
                <div className="mb-4 space-y-2">
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 0.01}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      min="0.01"
                      max={listing.quantity}
                      step="0.01"
                      value={quantity}
                      onChange={handleQuantityInput}
                      className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-center text-sm outline-none ring-emerald-500 focus:ring-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= listing.quantity}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    Max: {listing.quantity} {listing.unit}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {successMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart || cartLoading || quantity <= 0}
                    className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                  </button>
                  <button
                    type="button"
                    onClick={handleContactSeller}
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Contact Seller
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Seller Information */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Seller Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-slate-700">Name:</span>{' '}
                <span className="text-slate-900">{listing.seller?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Email:</span>{' '}
                <span className="text-slate-900">{listing.seller?.email || 'N/A'}</span>
              </div>
              {listing.seller?.phone && (
                <div>
                  <span className="font-medium text-slate-700">Phone:</span>{' '}
                  <span className="text-slate-900">{listing.seller.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;
