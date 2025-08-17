import { useState, useEffect } from 'react';

const Profile = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        pincode: user?.address?.pincode || ''
      }
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.address.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.address.pincode) {
      newErrors.pincode = 'Pincode is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update local user data
      onUpdate(data.user);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
    } catch (error) {
      setApiError(error.message);
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

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status ? 'status-verified' : 'status-unverified'}`}>
        {status ? 'Verified' : 'Unverified'}
      </span>
    );
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="profile-info">
          <h1>{user?.name}</h1>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User Type:</strong> {getUserTypeLabel(user?.userType)}</p>
          <p><strong>Status:</strong> {getStatusBadge(user?.isVerified)}</p>
          <p><strong>Member Since:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <div className="d-flex justify-center align-center mb-3">
          <h2>Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-primary ml-auto"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        
        {apiError && (
          <div className="error-message text-center mb-3">
            {apiError}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message text-center mb-3">
            {successMessage}
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-control ${errors.name ? 'error' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <div className="error-message">{errors.name}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <div className="error-message">{errors.phone}</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  type="text"
                  id="street"
                  name="address.street"
                  className="form-control"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Enter street address"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="address.city"
                  className={`form-control ${errors.city ? 'error' : ''}`}
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <div className="error-message">{errors.city}</div>
                )}
              </div>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="address.state"
                  className={`form-control ${errors.state ? 'error' : ''}`}
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <div className="error-message">{errors.state}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="pincode">Pincode</label>
                <input
                  type="text"
                  id="pincode"
                  name="address.pincode"
                  className={`form-control ${errors.pincode ? 'error' : ''}`}
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="Enter pincode"
                />
                {errors.pincode && (
                  <div className="error-message">{errors.pincode}</div>
                )}
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-2">
            <div>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Phone:</strong> {user?.phone}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User Type:</strong> {getUserTypeLabel(user?.userType)}</p>
            </div>
            <div>
              <p><strong>Street:</strong> {user?.address?.street || 'Not specified'}</p>
              <p><strong>City:</strong> {user?.address?.city || 'Not specified'}</p>
              <p><strong>State:</strong> {user?.address?.state || 'Not specified'}</p>
              <p><strong>Pincode:</strong> {user?.address?.pincode || 'Not specified'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Account Security */}
      <div className="card">
        <h2>Account Security</h2>
        <div className="grid grid-2">
          <div>
            <p><strong>Password:</strong> ••••••••</p>
            <p><strong>Two-Factor Auth:</strong> Not enabled</p>
          </div>
          <div>
            <button className="btn btn-secondary">
              Change Password
            </button>
            <button className="btn btn-secondary">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>

      {/* Dual Role Information */}
      {user.userType === 'both' && (
        <div className="card">
          <h2>Dual Role Capabilities</h2>
          <div className="grid grid-2">
            <div className="text-center p-3 border rounded">
              <h3>🛒 Buyer Role</h3>
              <p>You can browse and purchase waste materials from other users</p>
              <Link to="/waste" className="btn btn-primary">
                Browse Listings
              </Link>
            </div>
            <div className="text-center p-3 border rounded">
              <h3>💰 Seller Role</h3>
              <p>You can post your waste materials for sale</p>
              <Link to="/create-listing" className="btn btn-success">
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="card">
        <h2>Account Actions</h2>
        <div className="grid grid-3">
          <button className="btn btn-danger">
            Delete Account
          </button>
          <button className="btn btn-secondary">
            Export Data
          </button>
          <button className="btn btn-secondary">
            Privacy Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
