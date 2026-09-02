import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { getSocket } from '../../lib/socket';
import AuthPromptModal from '../../components/AuthPromptModal';

const MarketplaceMap = lazy(() => import('../../components/MarketplaceMap'));

const categories = [
  { id: '', label: 'All Categories', icon: '📦' },
  { id: 'plastic', label: 'Plastics (PET/HDPE)', icon: '🧴' },
  { id: 'metal', label: 'Scrap Metals', icon: '🔩' },
  { id: 'paper', label: 'Paper & Cardboard', icon: '📦' },
  { id: 'electronic', label: 'E-Waste & PCBs', icon: '💻' },
  { id: 'glass', label: 'Glass Cullet', icon: '🍾' },
  { id: 'organic', label: 'Organic Biomass', icon: '🌿' },
  { id: 'textile', label: 'Textile Fabric', icon: '🧵' },
];

const sortOptions = [
  { value: 'createdAt_desc', label: 'Featured / Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'price_asc', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
  { value: 'price_desc', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
  { value: 'quantity_desc', label: 'Highest Bulk Quantity', sortBy: 'quantity', sortOrder: 'desc' },
];

// Fallback imagery
const getCategoryFallbackImage = (category) => {
  const map = {
    plastic: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    metal: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    paper: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop&q=80',
    electronic: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop&q=80',
    glass: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=600&auto=format&fit=crop&q=80',
    organic: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
    textile: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80',
  };
  return map[category?.toLowerCase()] || map.plastic;
};

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [addingCartId, setAddingCartId] = useState(null);
  const [cartSuccessNotice, setCartSuccessNotice] = useState(null);

  // Auth Gate Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalDetails, setAuthModalDetails] = useState({
    title: 'Sign In to Purchase Scrap',
    message: 'Please sign in or create an account to purchase items, add to cart, or submit price offers.',
  });

  // Filter query parameters
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedSort, setSelectedSort] = useState('createdAt_desc');

  // Load listings from API
  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedSortOpt = sortOptions.find((s) => s.value === selectedSort) || sortOptions[0];
      const params = {
        page: 1,
        limit: 24,
        sortBy: selectedSortOpt.sortBy,
        sortOrder: selectedSortOpt.sortOrder,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (cityFilter.trim()) params.city = cityFilter.trim();

      const res = await apiClient.get('/listings', { params });
      setListings(res.data?.data?.listings || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setError(err.response?.data?.message || 'Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [searchQuery, selectedCategory, selectedSort, minPrice, maxPrice, cityFilter]);

  // Real-time stock change listener via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStockUpdate = (data) => {
      if (data?.listingId) {
        setListings((prevListings) =>
          prevListings.map((item) =>
            item._id === data.listingId
              ? {
                  ...item,
                  quantity: data.remainingQuantity,
                  status: data.status || (data.remainingQuantity <= 0 ? 'sold' : item.status),
                }
              : item
          )
        );
      }
    };

    socket.on('listingStockChanged', handleStockUpdate);
    return () => {
      socket.off('listingStockChanged', handleStockUpdate);
    };
  }, []);

  // Handle Category Click
  function handleSelectCategory(catId) {
    const nextParams = new URLSearchParams(searchParams);
    if (catId) {
      nextParams.set('category', catId);
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  }

  // Handle Add to Cart (with Auth Gate)
  async function handleAddToCartClick(e, listing) {
    e.preventDefault();
    e.stopPropagation();

    // Check auth
    if (!user) {
      setAuthModalDetails({
        title: 'Sign In to Add to Cart',
        message: `Sign in to add "${listing.title}" to your cart and proceed with checkout.`,
      });
      setShowAuthModal(true);
      return;
    }

    if (listing.seller?._id === user.id || listing.seller?._id?.toString() === user.id) {
      alert('You cannot purchase your own listing.');
      return;
    }

    setAddingCartId(listing._id);
    try {
      await addToCart(listing._id, 1);
      setCartSuccessNotice(`🛒 Added "${listing.title}" (1 ${listing.unit}) to your cart!`);
      setTimeout(() => setCartSuccessNotice(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingCartId(null);
    }
  }

  // Handle Buy Now (with Auth Gate)
  async function handleBuyNowClick(e, listing) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAuthModalDetails({
        title: 'Sign In to Buy Now',
        message: `Sign in or create an account to instantly purchase "${listing.title}".`,
      });
      setShowAuthModal(true);
      return;
    }

    if (listing.seller?._id === user.id || listing.seller?._id?.toString() === user.id) {
      alert('You cannot purchase your own listing.');
      return;
    }

    try {
      await addToCart(listing._id, 1);
      navigate('/checkout');
    } catch (err) {
      navigate(`/listing/${listing._id}`);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Cart Success Flash Alert ── */}
      {cartSuccessNotice && (
        <div className="fixed top-20 right-5 z-50 rounded-2xl bg-emerald-700 text-white p-4 shadow-2xl flex items-center justify-between gap-4 border border-emerald-500 animate-slide-in">
          <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold">
            <span className="text-lg">✅</span>
            <span>{cartSuccessNotice}</span>
          </div>
          <Link
            to="/cart"
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow"
          >
            View Cart →
          </Link>
        </div>
      )}

      {/* ── Clean E-Commerce Hero Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 text-xs font-bold text-emerald-300 mb-2">
            <span>CleanNect Recyclables Marketplace</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            Buy & Sell Recyclable Waste at Real-Time Spot Rates.
          </h1>
          <p className="mt-2 text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
            Browse verified scrap lots across India. Pick from plastics, high-grade metals, cardboard, and industrial waste ready for pickup.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <a
              href="#listings-grid"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs transition shadow active:scale-95"
            >
              <span>Explore Active Lots ↓</span>
            </a>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 text-xs border border-white/20 transition"
            >
              <span>Create Account Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Amazon-Style 4-Quad Scrap Category Grid ── */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Quad 1: Plastics */}
        <div
          onClick={() => handleSelectCategory('plastic')}
          className="group cursor-pointer rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition">
              Plastics (PET & HDPE)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Bottles, packaging, films</p>
            <div className="mt-2.5 overflow-hidden rounded-xl h-28 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=80"
                alt="Plastics"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 mt-2.5 block group-hover:underline">
            View Plastics →
          </span>
        </div>

        {/* Quad 2: Scrap Metals */}
        <div
          onClick={() => handleSelectCategory('metal')}
          className="group cursor-pointer rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition">
              Scrap Metals
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Copper, brass, aluminum, iron</p>
            <div className="mt-2.5 overflow-hidden rounded-xl h-28 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
                alt="Metals"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 mt-2.5 block group-hover:underline">
            View Metals →
          </span>
        </div>

        {/* Quad 3: Cardboard & Paper */}
        <div
          onClick={() => handleSelectCategory('paper')}
          className="group cursor-pointer rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition">
              Cardboard & Paper
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Cartons, kraft sheets, office waste</p>
            <div className="mt-2.5 overflow-hidden rounded-xl h-28 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80"
                alt="Paper & Cardboard"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 mt-2.5 block group-hover:underline">
            View Paper & Cartons →
          </span>
        </div>

        {/* Quad 4: E-Waste */}
        <div
          onClick={() => handleSelectCategory('electronic')}
          className="group cursor-pointer rounded-2xl bg-white p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
        >
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition">
              E-Waste & PCBs
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Circuit boards, appliances, wires</p>
            <div className="mt-2.5 overflow-hidden rounded-xl h-28 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1597733336794-12d05021d510?w=500&auto=format&fit=crop&q=80"
                alt="E-Waste"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 mt-2.5 block group-hover:underline">
            View E-Waste →
          </span>
        </div>
      </section>

      {/* ── Category Pill Bar & View Mode Toggle ── */}
      <section id="listings-grid" className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Horizontal Category Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort & Grid/Map Mode */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Product Marketplace Grid ── */}
      {viewMode === 'map' ? (
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
          <div className="mb-3 px-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Showing {listings.length} waste listings on map
            </span>
            <span className="text-[11px] text-slate-400">Click any pin to inspect lot & purchase</span>
          </div>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading map...</div>}>
            <MarketplaceMap listings={listings} height="320px" />
          </Suspense>
        </section>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="rounded-3xl bg-white p-4 border border-slate-200 space-y-3 animate-pulse">
              <div className="h-44 rounded-2xl bg-slate-200" />
              <div className="h-4 rounded bg-slate-200 w-3/4" />
              <div className="h-3 rounded bg-slate-200 w-1/2" />
              <div className="h-8 rounded-xl bg-slate-200 mt-4" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200 space-y-3">
          <span className="text-4xl">📦</span>
          <h3 className="text-lg font-bold text-slate-800">No listings found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No active listings match your current filters. Try selecting "All Categories" or searching a different keyword.
          </p>
          <button
            onClick={() => {
              setSearchParams({});
              setMinPrice('');
              setMaxPrice('');
              setCityFilter('');
            }}
            className="rounded-xl bg-emerald-600 text-white font-bold px-4 py-2 text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {listings.map((item) => {
            const isAvailable = item.status === 'available' && item.quantity > 0;
            const isSellingFast = item.initialQuantity && item.quantity <= item.initialQuantity / 2;
            const imgSrc = item.images?.[0] || getCategoryFallbackImage(item.category);
            const isWish = isWishlisted(item._id);

            return (
              <div
                key={item._id}
                className="group relative rounded-3xl bg-white p-4 border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100 mb-3">
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Choice / Selling Fast Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {isSellingFast && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase shadow">
                          ⚡ Selling Fast
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-white font-bold text-[10px] uppercase backdrop-blur-md">
                        {item.category}
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(item._id);
                      }}
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center text-sm transition hover:scale-110"
                      title="Save to Wishlist"
                    >
                      {isWish ? '❤️' : '🤍'}
                    </button>

                    {/* Location Badge */}
                    {item.location?.city && (
                      <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[10px] font-medium flex items-center gap-1">
                        <span>📍</span>
                        <span className="truncate max-w-[150px]">{item.location.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Seller */}
                  <Link to={`/listing/${item._id}`}>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-emerald-700 transition leading-snug">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    <span className="text-amber-500 font-bold">★ 4.9</span>
                    <span className="text-[11px] text-slate-400">• Verified Seller</span>
                  </div>

                  {/* Stock Quantity Progress Bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className={item.quantity <= 10 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {isAvailable ? `${item.quantity} ${item.unit} available` : 'Sold out'}
                      </span>
                      {item.initialQuantity && (
                        <span className="text-slate-400 text-[10px]">
                          Lot: {item.initialQuantity} {item.unit}
                        </span>
                      )}
                    </div>
                    {item.initialQuantity && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(5, (item.quantity / item.initialQuantity) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pricing Box (Amazon style) */}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">₹{item.price}</span>
                    <span className="text-xs font-semibold text-slate-500">/ {item.unit}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">
                      Spot Rate
                    </span>
                  </div>
                </div>

                {/* Amazon-Style Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => handleAddToCartClick(e, item)}
                      disabled={!isAvailable || addingCartId === item._id}
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-40"
                    >
                      {addingCartId === item._id ? 'Adding...' : 'Add to Cart'}
                    </button>

                    <button
                      onClick={(e) => handleBuyNowClick(e, item)}
                      disabled={!isAvailable}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition shadow-sm disabled:opacity-40"
                    >
                      Buy Now
                    </button>
                  </div>

                  <Link
                    to={`/listing/${item._id}`}
                    className="w-full block text-center py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition"
                  >
                    View Details & Reviews →
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Global Auth Prompt Modal (For Guests) ── */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={authModalDetails.title}
        message={authModalDetails.message}
      />
    </div>
  );
}
