import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalEarnings: 0,
    completedDeals: 0
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user's waste listings
      const response = await fetch('http://localhost:5000/api/waste/user/listings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const listings = data.waste || [];
        
        setRecentListings(listings.slice(0, 5)); // Show last 5 listings
        
        // Calculate stats
        setStats({
          totalListings: listings.length,
          activeListings: listings.filter(l => l.status === 'available').length,
          totalEarnings: listings
            .filter(l => l.status === 'sold')
            .reduce((sum, l) => sum + l.price, 0),
          completedDeals: listings.filter(l => l.status === 'sold').length
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      household: 'Household',
      collector: 'Waste Collector',
      buyer: 'Waste Buyer',
      both: 'Buyer & Seller'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name}! 👋</h1>
          <p>Here's what's happening with your Cleannect account</p>
        </div>
        <Link to="/create-listing" className="btn btn-success">
          + Post New Waste
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalListings}</div>
          <div className="stat-label">Total Listings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.activeListings}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">₹{stats.totalEarnings}</div>
          <div className="stat-label">Total Earnings</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.completedDeals}</div>
          <div className="stat-label">Completed Deals</div>
        </div>
      </div>

      {/* User Info */}
      <div className="card">
        <h2>Account Information</h2>
        <div className="grid grid-2">
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>User Type:</strong> {getUserTypeLabel(user.userType)}</p>
          </div>
          <div>
            <p><strong>City:</strong> {user.address?.city || 'Not specified'}</p>
            <p><strong>State:</strong> {user.address?.state || 'Not specified'}</p>
            <p><strong>Pincode:</strong> {user.address?.pincode || 'Not specified'}</p>
            <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-3">
          <Link to="/profile" className="btn btn-primary">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="card">
        <div className="d-flex justify-center align-center">
          <h2>Recent Listings</h2>
          <Link to="/waste" className="btn btn-primary ml-auto">
            View All
          </Link>
        </div>
        
        {recentListings.length > 0 ? (
          <div className="waste-grid">
            {recentListings.map((listing) => (
              <div key={listing._id} className="waste-card">
                <div className="waste-image">
                  {listing.images && listing.images.length > 0 ? '📷' : '♻️'}
                </div>
                <div className="waste-content">
                  <h3 className="waste-title">{listing.title}</h3>
                  <p className="waste-description">{listing.description}</p>
                  <div className="waste-meta">
                    <span className="waste-price">₹{listing.price}</span>
                    <span className="waste-category">{listing.category}</span>
                  </div>
                  <div className="waste-actions">
                    <Link 
                      to={`/waste/${listing._id}`} 
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                    <Link 
                      to={`/waste/edit/${listing._id}`} 
                      className="btn btn-secondary"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p>No listings yet. Start by posting your first waste item!</p>
            <Link to="/create-listing" className="btn btn-success">
              Post Your First Listing
            </Link>
          </div>
        )}
      </div>

      {/* Dual Role Dashboard Section */}
      {user.userType === 'both' && (
        <div className="card">
          <h2>Marketplace Activity</h2>
          <div className="grid grid-2">
            <div className="text-center p-3 border rounded">
              <h3>📊 Your Sales</h3>
              <div className="stat-number">{stats.totalListings}</div>
              <div className="stat-label">Active Listings</div>
              <Link to="/waste" className="btn btn-primary mt-2">
                Manage Listings
              </Link>
            </div>
            <div className="text-center p-3 border rounded">
              <h3>🛒 Your Purchases</h3>
              <div className="stat-number">0</div>
              <div className="stat-label">Completed Purchases</div>
              <Link to="/waste" className="btn btn-success mt-2">
                Browse More
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2>Quick Actions</h2>
        <div className="grid grid-3">
          <Link to="/create-listing" className="btn btn-success w-100">
            📝 Post New Waste
          </Link>
          <Link to="/waste" className="btn btn-primary w-100">
            🔍 Browse Listings
          </Link>
          <Link to="/profile" className="btn btn-secondary w-100">
            👤 Manage Profile
          </Link>
        </div>
      </div>

      {/* Dual Role Actions for Both Buyers and Sellers */}
      {user.userType === 'both' && (
        <div className="card">
          <h2>Dual Role Actions</h2>
          <p className="mb-3">
            As a buyer and seller, you can both post waste for sale and purchase from others.
          </p>
          <div className="grid grid-2">
            <div className="text-center p-3 border rounded">
              <h3>🛒 Shopping Mode</h3>
              <p>Browse and purchase waste materials from other users</p>
              <Link to="/waste" className="btn btn-primary">
                Browse Listings
              </Link>
            </div>
            <div className="text-center p-3 border rounded">
              <h3>💰 Selling Mode</h3>
              <p>Post your waste materials for sale</p>
              <Link to="/create-listing" className="btn btn-success">
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
