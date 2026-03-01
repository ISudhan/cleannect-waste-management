import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import LocationPicker from '../../components/LocationPicker';

const categories = ['plastic', 'paper', 'metal', 'glass', 'organic', 'electronic', 'textile', 'other'];
const units = ['kg', 'tons', 'pieces', 'liters', 'units'];

function ListingFormPage({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'plastic',
    quantity: '',
    unit: 'kg',
    price: '',
  });
  const [location, setLocation] = useState(null); // { lat, lng, city, state, country }
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get(`/listings/${id}`);
        if (cancelled) return;
        const listing = res.data?.data?.listing;
        if (!listing) return;
        setForm({
          title: listing.title || '',
          description: listing.description || '',
          category: listing.category || 'plastic',
          quantity: listing.quantity ?? '',
          unit: listing.unit || 'kg',
          price: listing.price ?? '',
        });
        if (listing.location?.coordinates) {
          const [lng, lat] = listing.location.coordinates;
          setLocation({
            lat,
            lng,
            city: listing.location.city || '',
            state: listing.location.state || '',
            country: listing.location.country || 'India',
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load listing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files || []));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Append location data if the user picked one
      if (location?.lat && location?.lng) {
        formData.append('location[lat]', location.lat);
        formData.append('location[lng]', location.lng);
        if (location.city) formData.append('location[city]', location.city);
        if (location.state) formData.append('location[state]', location.state);
        if (location.country) formData.append('location[country]', location.country);
      }

      images.forEach((file) => formData.append('images', file));

      if (isEdit) {
        await apiClient.put(`/listings/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post('/listings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/dashboard/listings');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to save listing.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in max-w-2xl">
      <div>
        <h1 className="section-title">{isEdit ? 'Edit Listing' : 'Create Listing'}</h1>
        <p className="section-subtitle">Provide details about the recyclable material you're offering.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Basic Info</h2>

          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">Title</label>
            <input id="title" name="title" required maxLength={100} value={form.title} onChange={handleChange} className="input-field" placeholder="e.g. Crushed PET Bottles — Grade A" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea id="description" name="description" required maxLength={1000} rows={4} value={form.description} onChange={handleChange} className="input-field resize-none" placeholder="Describe condition, purity, packaging details…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-sm font-semibold text-slate-700">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange} className="input-field">
                {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="block text-sm font-semibold text-slate-700">Quantity</label>
              <input id="quantity" name="quantity" type="number" min="0.01" step="0.01" required={!isEdit} value={form.quantity} onChange={handleChange} className="input-field" placeholder="100" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="unit" className="block text-sm font-semibold text-slate-700">Unit</label>
              <select id="unit" name="unit" value={form.unit} onChange={handleChange} className="input-field">
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="price" className="block text-sm font-semibold text-slate-700">Price per unit (₹)</label>
              <input id="price" name="price" type="number" min="0" step="0.01" required={!isEdit} value={form.price} onChange={handleChange} className="input-field" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="images" className="block text-sm font-semibold text-slate-700">Images (up to 5)</label>
              <input
                id="images" type="file" accept="image/*" multiple onChange={handleImageChange}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* ── Location Picker ── */}
        <div className="card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Pickup Location</h2>
            <p className="text-xs text-slate-400 mt-0.5">Search for an address or click on the map to mark the pickup point.</p>
          </div>
          <LocationPicker value={location} onChange={setLocation} height="320px" />
          {location?.city && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="badge badge-green">✓ Location set</span>
              <span>{[location.city, location.state, location.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-base">
            {saving ? (
              <><span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
            ) : isEdit ? 'Save Changes' : 'Create Listing'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard/listings')} className="btn-secondary py-3 px-6">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ListingFormPage;
