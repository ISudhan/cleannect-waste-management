import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateListing = ({ user }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'plastic',
    quantity: '',
    unit: 'kg',
    price: '',
    condition: 'good',
    pickupRequired: true,
    expiryDate: '',
    tags: '',
    location: {
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    if (!formData.location.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.location.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.location.pincode) {
      newErrors.pincode = 'Pincode is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Process tags
      const processedTags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const listingData = {
        ...formData,
        tags: processedTags,
        images: [] // For now, no image upload
      };
      
      const response = await fetch('http://localhost:5000/api/waste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(listingData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create listing');
      }
      
      // Success - redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="form-container">
      <div className="card">
        <h2 className="text-center">Post New Waste Listing</h2>
        <p className="text-center mb-3">
          Sell your recyclable waste and earn money while helping the environment
        </p>
        
        {apiError && (
          <div className="error-message text-center mb-3">
            {apiError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-group">
            <label htmlFor="title">Listing Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-control ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Clean plastic bottles, Old newspapers, etc."
            />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              className={`form-control ${errors.description ? 'error' : ''}`}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your waste item in detail..."
              rows="4"
            />
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
          </div>
          
          {/* Category and Details */}
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="plastic">🥤 Plastic</option>
                <option value="paper">📰 Paper</option>
                <option value="metal">🔧 Metal</option>
                <option value="glass">🥃 Glass</option>
                <option value="organic">🍃 Organic</option>
                <option value="electronics">📱 Electronics</option>
                <option value="textiles">👕 Textiles</option>
                <option value="other">♻️ Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                className="form-control"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
          
          {/* Quantity and Price */}
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                className={`form-control ${errors.quantity ? 'error' : ''}`}
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="1"
                step="0.1"
              />
              {errors.quantity && (
                <div className="error-message">{errors.quantity}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <select
                id="unit"
                name="unit"
                className="form-control"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="pieces">Pieces</option>
                <option value="bags">Bags</option>
                <option value="boxes">Boxes</option>
                <option value="tons">Tons</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                className={`form-control ${errors.price ? 'error' : ''}`}
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                min="0"
                step="0.01"
              />
              {errors.price && (
                <div className="error-message">{errors.price}</div>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="location.city"
                className={`form-control ${errors.city ? 'error' : ''}`}
                value={formData.location.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              {errors.city && (
                <div className="error-message">{errors.city}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State *</label>
              <input
                type="text"
                id="state"
                name="location.state"
                className={`form-control ${errors.state ? 'error' : ''}`}
                value={formData.location.state}
                onChange={handleChange}
                placeholder="Enter state"
              />
              {errors.state && (
                <div className="error-message">{errors.state}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="pincode">Pincode *</label>
              <input
                type="text"
                id="pincode"
                name="location.pincode"
                className={`form-control ${errors.pincode ? 'error' : ''}`}
                value={formData.location.pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <div className="error-message">{errors.pincode}</div>
              )}
            </div>
          </div>
          
          {/* Additional Options */}
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date (Optional)</label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tags">Tags (Optional)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                className="form-control"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., recyclable, clean, sorted"
              />
              <small>Separate tags with commas</small>
            </div>
          </div>
          
          <div className="form-group">
            <label className="d-flex align-center gap-2">
              <input
                type="checkbox"
                name="pickupRequired"
                checked={formData.pickupRequired}
                onChange={handleChange}
              />
              Pickup required (buyer needs to collect)
            </label>
          </div>
          
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
        
        <div className="text-center mt-3">
          <p>
            <strong>Tip:</strong> Be specific about the condition and quantity. 
            Good descriptions help you get better offers!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
