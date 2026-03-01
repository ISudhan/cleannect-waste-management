import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../lib/apiClient';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', profilePicture: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', ok: true });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', ok: true });

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/users/profile').then((res) => {
      if (cancelled) return;
      const u = res.data?.data?.user ?? {};
      setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', address: u.address || '', profilePicture: u.profilePicture || '' });
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: '', ok: true });
    setSavingProfile(true);
    try {
      const res = await apiClient.put('/users/profile', { name: form.name, phone: form.phone, address: form.address, profilePicture: form.profilePicture });
      const updated = res.data?.data?.user;
      if (updated) setUser({ ...(user || {}), ...updated });
      setProfileMessage({ text: '✓ Profile saved successfully!', ok: true });
    } catch (err) {
      setProfileMessage({ text: err.response?.data?.message || 'Failed to update profile.', ok: false });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', ok: true });
    setSavingPassword(true);
    try {
      await apiClient.put('/users/change-password', passwordForm);
      setPasswordMessage({ text: '✓ Password updated!', ok: true });
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMessage({ text: err.response?.data?.message || 'Failed to update password.', ok: false });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner mx-auto" />
      </div>
    );
  }

  const initials = form.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      {/* Header with avatar */}
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-2xl font-bold text-white shadow-md">
          {form.profilePicture ? (
            <img src={form.profilePicture} alt={form.name} className="h-full w-full rounded-2xl object-cover" />
          ) : initials}
        </div>
        <div>
          <h1 className="section-title">{form.name || 'Your Profile'}</h1>
          <p className="section-subtitle">{form.email}</p>
          {user?.rating > 0 && (
            <div className="mt-1 flex items-center gap-1 text-sm text-amber-500 font-medium">
              {'★'.repeat(Math.round(user.rating))}{'☆'.repeat(5 - Math.round(user.rating))}
              <span className="text-xs text-slate-400 ml-1">({user.totalRatings} reviews)</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Profile Details</h2>
        {profileMessage.text && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${profileMessage.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {profileMessage.text}
          </div>
        )}
        <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Full Name</label>
            <input id="name" name="name" required minLength={2} value={form.name} onChange={handleProfileChange} className="input-field" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email <span className="font-normal text-slate-400">(read-only)</span></label>
            <input value={form.email} disabled className="input-field bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleProfileChange} className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profilePicture" className="block text-sm font-semibold text-slate-700">Avatar URL</label>
            <input id="profilePicture" name="profilePicture" value={form.profilePicture} onChange={handleProfileChange} className="input-field" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label htmlFor="address" className="block text-sm font-semibold text-slate-700">Address</label>
            <textarea id="address" name="address" rows={2} value={form.address} onChange={handleProfileChange} className="input-field resize-none" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingProfile} className="btn-primary py-2.5 px-6">
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Change Password</h2>
        {passwordMessage.text && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${passwordMessage.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {passwordMessage.text}
          </div>
        )}
        <form onSubmit={submitPassword} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-700">Current Password</label>
            <input
              id="currentPassword" name="currentPassword" type="password" required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700">New Password</label>
            <input
              id="newPassword" name="newPassword" type="password" required minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <button type="submit" disabled={savingPassword} className="btn-secondary py-2.5 px-6">
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
