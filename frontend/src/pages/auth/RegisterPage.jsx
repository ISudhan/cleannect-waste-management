import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const fields = [
  { id: 'name',     label: 'Full name',  type: 'text',     placeholder: 'Jane Smith',           required: true, minLength: 2 },
  { id: 'email',    label: 'Email',      type: 'email',    placeholder: 'you@example.com',       required: true },
  { id: 'password', label: 'Password',   type: 'password', placeholder: 'Min. 6 characters',    required: true, minLength: 6 },
  { id: 'phone',    label: 'Phone',      type: 'tel',      placeholder: '+91 98765 43210',       required: true },
  { id: 'address',  label: 'Address',    type: 'textarea', placeholder: 'Your business address', required: false },
];

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [showPw, setShowPw] = useState(false);
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
    <div className="flex min-h-[80vh] items-center justify-center py-8">
      <div className="w-full max-w-lg fade-in">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Join Cleannect</h1>
          <p className="mt-1.5 text-sm text-slate-500">Buy and sell recyclable waste materials</p>
        </div>

        <div className="card p-8">
        {/* Google Sign-Up */}
          <GoogleAuthButton label="Sign up with Google" />

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or fill in the form below</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) =>
              f.type === 'textarea' ? (
                <div key={f.id} className="sm:col-span-2 space-y-1.5">
                  <label htmlFor={f.id} className="block text-sm font-semibold text-slate-700">
                    {f.label}
                  </label>
                  <textarea
                    id={f.id}
                    name={f.id}
                    rows={2}
                    value={form[f.id]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className="input-field resize-none"
                  />
                </div>
              ) : f.id === 'password' ? (
                <div key={f.id} className="sm:col-span-2 space-y-1.5">
                  <label htmlFor={f.id} className="block text-sm font-semibold text-slate-700">
                    {f.label}
                  </label>
                  <div className="relative">
                    <input
                      id={f.id}
                      name={f.id}
                      type={showPw ? 'text' : 'password'}
                      required={f.required}
                      minLength={f.minLength}
                      value={form[f.id]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className="input-field pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              ) : (
                <div key={f.id} className="space-y-1.5">
                  <label htmlFor={f.id} className="block text-sm font-semibold text-slate-700">
                    {f.label}
                  </label>
                  <input
                    id={f.id}
                    name={f.id}
                    type={f.type}
                    required={f.required}
                    minLength={f.minLength}
                    value={form[f.id]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    className="input-field"
                  />
                </div>
              )
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-base"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create free account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-semibold text-emerald-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-600">← Back to marketplace</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
