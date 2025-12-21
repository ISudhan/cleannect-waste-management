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
          setListings(res.data?.data?.listings ?? []);
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
      {/* Hero Section */}
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Connect buyers and sellers of recyclable waste.
        </h1>
        <p className="mt-3 text-sm text-slate-600 md:text-base">
          Cleannect helps you list, discover, and trade recyclable materials with verified
          partners. Manage your listings, orders, and communication from a single dashboard.
        </p>
      </section>

      {/* Search and Filter Section */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search listings by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter Toggle and Sort */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Live Marketplace</h2>
          {!loading && listings.length > 0 && (
            <p className="text-sm text-slate-600">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
            </p>
          )}
        </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-500">Loading listings...</p>
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-slate-500">
                {hasActiveFilters
                  ? 'No listings found matching your filters. Try adjusting your search criteria.'
                  : 'No listings yet. Be the first to create one.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {listings.map((listing) => {
                const mainImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
                return (
                  <Link
                    key={listing._id}
                    to={`/listing/${listing._id}`}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-md"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <img
                        src={mainImage || getCategoryFallbackImage(listing.category)}
                        alt={listing.title}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to category image if the main image fails to load
                          e.target.src = getCategoryFallbackImage(listing.category);
                        }}
                      />
                      {/* Status Badge */}
                      {listing.status && (
                        <div className="absolute top-2 right-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              listing.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : listing.status === 'sold'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {listing.status === 'available' ? 'Available' : listing.status}
                          </span>
                        </div>
                      )}
                      {/* Category Badge */}
                      {listing.category && (
                        <div className="absolute top-2 left-2">
                          <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium capitalize text-slate-700 backdrop-blur-sm">
                            {listing.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
                        {listing.title}
                      </h3>
                      
                      {/* Price */}
                      <div className="mb-2 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900">₹{listing.price}</span>
                        <span className="text-xs text-slate-500">/{listing.unit}</span>
                      </div>

                      {/* Quantity & Location */}
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <span>
                            {listing.quantity} {listing.unit} available
                          </span>
                        </div>
                        {listing.location?.city && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span className="truncate">
                              {listing.location.city}
                              {listing.location.state ? `, ${listing.location.state}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
                          View Details
                        </span>
                        <svg
                          className="h-4 w-4 text-emerald-600 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
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






