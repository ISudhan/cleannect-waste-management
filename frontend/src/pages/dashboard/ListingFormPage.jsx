import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    return <div className="text-sm text-slate-600">Loading listing...</div>;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? 'Edit listing' : 'Create listing'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Provide details about the recyclable material you&apos;re offering.
        </p>
      </header>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-5 text-sm shadow-sm"
      >
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={100}
            value={form.title}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            maxLength={1000}
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="category" className="text-xs font-medium text-slate-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="quantity" className="text-xs font-medium text-slate-700">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              required={!isEdit}
              value={form.quantity}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="unit" className="text-xs font-medium text-slate-700">
              Unit
            </label>
            <select
              id="unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="price" className="text-xs font-medium text-slate-700">
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required={!isEdit}
              value={form.price}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="images" className="text-xs font-medium text-slate-700">
              Images
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-800 hover:file:bg-slate-200"
            />
            <p className="text-[11px] text-slate-500">You can upload up to 5 images.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create listing'}
        </button>
      </form>
    </div>
  );
}

export default ListingFormPage;


