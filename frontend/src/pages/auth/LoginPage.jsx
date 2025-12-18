import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Access your Cleannect dashboard to manage listings, orders, and messages.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5 text-sm">
          <label htmlFor="email" className="font-medium text-slate-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <label htmlFor="password" className="font-medium text-slate-800">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="text-xs text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-medium text-emerald-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;


