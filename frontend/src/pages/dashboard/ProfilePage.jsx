import { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';

const roles = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'both', label: 'Both' },
];

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'both',
    address: '',
    profilePicture: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        if (cancelled) return;
        const u = res.data?.data?.user ?? {};
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || 'both',
          address: u.address || '',
          profilePicture: u.profilePicture || '',
        });
      } catch {
        // ignore, errors will be visible via general UX later
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const res = await apiClient.put('/users/profile', {
        name: form.name,
        phone: form.phone,
        role: form.role,
        address: form.address,
        profilePicture: form.profilePicture,
      });
      const updated = res.data?.data?.user;
      if (updated) {
        setUser({ ...(user || {}), ...updated });
      }
      setProfileMessage('Profile updated.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setSavingPassword(true);
    try {
      await apiClient.put('/users/change-password', passwordForm);
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-600">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account details, roles, and security settings.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
        <form
          onSubmit={submitProfile}
          className="space-y-4 rounded-lg border bg-white p-5 text-sm shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">Profile details</h2>
          {profileMessage && (
            <p className="text-xs text-emerald-700" aria-live="polite">
              {profileMessage}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                value={form.name}
                onChange={handleProfileChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Email</label>
              <input
                value={form.email}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-slate-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleProfileChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="role" className="text-xs font-medium text-slate-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleProfileChange}
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
          <div className="space-y-1.5">
            <label htmlFor="address" className="text-xs font-medium text-slate-700">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={form.address}
              onChange={handleProfileChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profilePicture" className="text-xs font-medium text-slate-700">
              Profile picture URL
            </label>
            <input
              id="profilePicture"
              name="profilePicture"
              value={form.profilePicture}
              onChange={handleProfileChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {savingProfile ? 'Saving...' : 'Save changes'}
          </button>
        </form>
        <form
          onSubmit={submitPassword}
          className="space-y-4 rounded-lg border bg-white p-5 text-sm shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">Password</h2>
          {passwordMessage && (
            <p className="text-xs text-emerald-700" aria-live="polite">
              {passwordMessage}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-xs font-medium text-slate-700">
              Current password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-xs font-medium text-slate-700">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="mt-2 inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
          >
            {savingPassword ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;



