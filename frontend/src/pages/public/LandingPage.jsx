import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

const categories = [
  'plastic',
  'paper',
  'metal',
  'glass',
  'organic',
  'electronic',
  'textile',
  'other',
];

const sortOptions = [
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'createdAt', label: 'Oldest First', order: 'asc' },
  { value: 'price', label: 'Price: Low to High', order: 'asc' },
  { value: 'price', label: 'Price: High to Low', order: 'desc' },
  { value: 'listingStatus', label: 'Listing Status', order: 'asc' },
];

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

// Derive status for badge display using quantity and initialQuantity
const deriveListingStatus = (listing) => {
  const toNumber = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const remainingQuantity = toNumber(listing?.quantity) ?? 0;
  const initialQuantity = toNumber(listing?.initialQuantity);
  const backendStatus = listing?.status || 'available';

  const isUnavailable = remainingQuantity <= 0 || backendStatus !== 'available';

  const isSellingFast =
    !isUnavailable &&
    initialQuantity !== null &&
    initialQuantity > 0 &&
    remainingQuantity > 0 &&
    remainingQuantity <= initialQuantity / 2;

  if (isUnavailable) {
    return { label: 'Unavailable', classes: 'bg-slate-100 text-slate-700' };
  }
  if (isSellingFast) {
    return { label: 'Selling fast', classes: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'Available', classes: 'bg-green-50 text-green-700' };
};

function LandingPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          page: 1,
          limit: 8,
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        if (minPrice) {
          params.minPrice = minPrice;
        }
        if (maxPrice) {
          params.maxPrice = maxPrice;
        }
        if (city.trim()) {
          params.city = city.trim();
        }
        if (state.trim()) {
          params.state = state.trim();
        }
        if (sortBy) {
          params.sortBy = sortBy;
          params.sortOrder = sortOrder;
        }

        const res = await apiClient.get('/listings', { params });
        if (!cancelled) {
          let incoming = res.data?.data?.listings ?? [];

          // Apply client-side sort for derived listingStatus
          if (sortBy === 'listingStatus') {
            const statusPriority = {
              'Available': 2,
              'Selling fast': 1,
              'Unavailable': 0,
            };
            incoming = [...incoming].sort((a, b) => {
              const { label: labelA } = deriveListingStatus(a);
              const { label: labelB } = deriveListingStatus(b);
              const pa = statusPriority[labelA] ?? -1;
              const pb = statusPriority[labelB] ?? -1;
              if (pa === pb) return 0;
              return sortOrder === 'desc' ? pb - pa : pa - pb;
            });
          }

          setListings(incoming);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load listings.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      load();
    }, searchQuery ? 500 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, selectedCategory, minPrice, maxPrice, city, state, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setCity('');
    setState('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    minPrice ||
    maxPrice ||
    city ||
    state ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  return (
    <div className="space-y-6">
      {/* ── Gradient Hero Banner ── */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-6 py-10 text-white shadow-lg">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-3">♻️ Marketplace</span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Buy &amp; Sell Recyclable Waste
          </h1>
          <p className="mt-3 text-emerald-100 text-base">
            Cleannect connects verified buyers and sellers of plastic, metal, paper, and more — turning waste into value.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/auth/register" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition shadow">
              Start Selling Free
            </Link>
            <a href="#listings" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition">
              Browse Listings ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Search & Filter ── */}
      <section id="listings" className="card px-5 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search listings by title or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 py-3 text-sm"
          />
        </div>

        {/* Category pill filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setSelectedCategory('')} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${!selectedCategory ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'}`}>All</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)} className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${selectedCategory === cat ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'}`}>{cat}</button>
          ))}
        </div>


        {/* ── Filter row ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              showFilters || hasActiveFilters
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                Active
              </span>
            )}
          </button>


          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-slate-700">
              Sort:
            </label>
            <select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {sortOptions.map((option) => (
                <option
                  key={`${option.value}-${option.order}`}
                  value={`${option.value}-${option.order}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-slate-700">
                  Min Price (₹)
                </label>
                <input
                  type="number"
                  id="minPrice"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-slate-700">
                  Max Price (₹)
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="No limit"
                  min="0"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Location Filters */}
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="mb-1 block text-sm font-medium text-slate-700">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Live Marketplace</h2>
          {!loading && listings.length > 0 && (
            <p className="text-sm text-slate-400">
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-3 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">🔍</p>
              <p className="font-semibold text-slate-700">
                {hasActiveFilters ? 'No listings match your filters' : 'No listings yet'}
              </p>
              <p className="text-sm text-slate-400">{hasActiveFilters ? 'Try adjusting the search criteria.' : 'Be the first to create one.'}</p>
              {hasActiveFilters && (
                <button type="button" onClick={handleClearFilters} className="btn-secondary mt-2">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => {
                const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
                return (
                  <Link
                    key={listing._id}
                    to={`/listing/${listing._id}`}
                    className="group card card-hover overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={mainImage || getCategoryFallbackImage(listing.category)}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = getCategoryFallbackImage(listing.category); }}
                      />
                      {/* Status badge */}
                      {(() => {
                        const { label, classes } = deriveListingStatus(listing);
                        return (
                          <div className="absolute top-2 right-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-sm ${classes}`}>{label}</span>
                          </div>
                        );
                      })()}
                      {listing.category && (
                        <div className="absolute top-2 left-2">
                          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-700 backdrop-blur-sm">
                            {listing.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
                        {listing.title}
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-emerald-600">₹{listing.price}</span>
                        <span className="text-xs text-slate-400">/{listing.unit}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                        <span>📦 {listing.quantity} {listing.unit}</span>
                        {listing.location?.city && <span>📍 {listing.location.city}</span>}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2.5">
                        <span className="text-xs font-semibold text-emerald-600">View Details</span>
                        <svg className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
      </section>
    </div>
  );
}

export default LandingPage;






