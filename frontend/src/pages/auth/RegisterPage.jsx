import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const roles = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'both', label: 'Both' },
];

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'both',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Join Cleannect to buy and sell recyclable waste in your network.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5 text-sm">
          <label htmlFor="name" className="font-medium text-slate-800">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <label htmlFor="email" className="font-medium text-slate-800">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <label htmlFor="password" className="font-medium text-slate-800">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 text-sm">
            <label htmlFor="phone" className="font-medium text-slate-800">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1.5 text-sm">
            <label htmlFor="role" className="font-medium text-slate-800">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          <label htmlFor="address" className="font-medium text-slate-800">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            value={form.address}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="text-xs text-slate-600">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-emerald-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;



