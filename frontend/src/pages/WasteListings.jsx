import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const WasteListings = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchListings();
  }, [filters, pagination.currentPage]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      });
      
      const response = await fetch(`http://localhost:5000/api/waste?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.waste || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems
        }));
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getCategoryEmoji = (category) => {
    const emojis = {
      plastic: '🥤',
      paper: '📰',
      metal: '🔧',
      glass: '🥃',
      organic: '🍃',
      electronics: '📱',
      textiles: '👕',
      other: '♻️'
    };
    return emojis[category] || '♻️';
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: { text: 'Available', class: 'status-available' },
      sold: { text: 'Sold', class: 'status-sold' },
      reserved: { text: 'Reserved', class: 'status-reserved' },
      expired: { text: 'Expired', class: 'status-expired' }
    };
    
    const badge = badges[status] || { text: status, class: 'status-default' };
    
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading && listings.length === 0) {
    return <div className="loading">Loading listings...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-center align-center mb-4">
        <h1>Browse Waste Listings</h1>
        {user && (
          <div className="d-flex gap-2 ml-auto">
            <Link to="/waste" className="btn btn-primary">
              🔍 Browse
            </Link>
            <Link to="/create-listing" className="btn btn-success">
              + Post New Listing
            </Link>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <form onSubmit={handleSearch}>
          <div className="grid grid-4">
            <div className="form-group">
              <label htmlFor="search">Search</label>
              <input
                type="text"
                id="search"
                name="search"
                className="form-control"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search listings..."
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="organic">Organic</option>
                <option value="electronics">Electronics</option>
                <option value="textiles">Textiles</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="minPrice">Min Price</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                className="form-control"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min price"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxPrice">Max Price</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                className="form-control"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max price"
              />
            </div>
          </div>
          
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="City or state"
              />
            </div>
            
            <div className="d-flex align-center gap-2" style={{ marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary">
                🔍 Search
              </button>
              <button 
                type="button" 
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Count */}
      <div className="d-flex justify-center align-center mb-3">
        <p>
          Showing {listings.length} of {pagination.totalItems} listings
        </p>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className="waste-grid">
          {listings.map((listing) => (
            <div key={listing._id} className="waste-card">
              <div className="waste-image">
                {listing.images && listing.images.length > 0 ? '📷' : getCategoryEmoji(listing.category)}
              </div>
              <div className="waste-content">
                <div className="d-flex justify-center align-center mb-2">
                  <h3 className="waste-title">{listing.title}</h3>
                  {getStatusBadge(listing.status)}
                </div>
                
                <p className="waste-description">
                  {listing.description.length > 100 
                    ? `${listing.description.substring(0, 100)}...` 
                    : listing.description
                  }
                </p>
                
                <div className="waste-meta">
                  <span className="waste-price">₹{listing.price}</span>
                  <span className="waste-category">
                    {getCategoryEmoji(listing.category)} {listing.category}
                  </span>
                </div>
                
                <div className="waste-details mb-2">
                  <p><strong>Quantity:</strong> {listing.quantity} {listing.unit}</p>
                  <p><strong>Condition:</strong> {listing.condition}</p>
                  <p><strong>Location:</strong> {listing.location?.city}, {listing.location?.state}</p>
                  <p><strong>Seller:</strong> {listing.seller?.name}</p>
                </div>
                
                <div className="waste-actions">
                  <Link 
                    to={`/waste/${listing._id}`} 
                    className="btn btn-primary"
                  >
                    View Details
                  </Link>
                  
                  {user && user._id === listing.seller?._id && (
                    <Link 
                      to={`/waste/edit/${listing._id}`} 
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <h3>No listings found</h3>
          <p>Try adjusting your search criteria or check back later.</p>
          {user && (
            <Link to="/create-listing" className="btn btn-success">
              Post Your First Listing
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card text-center">
          <div className="d-flex justify-center align-center gap-2">
            <button
              className="btn btn-secondary"
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              ← Previous
            </button>
            
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-secondary"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteListings;
