import { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../auth/AuthContext';

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition ${star <= value ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <span className="text-sm text-amber-400">
      {'★'.repeat(Math.round(value))}
      {'☆'.repeat(5 - Math.round(value))}
    </span>
  );
}

/**
 * ReviewsSection — can be placed on ListingDetailPage or a seller profile.
 * @prop sellerId {string}
 * @prop listingId {string} optional
 * @prop orderId   {string} optional — supply to enable the "Write a review" form
 */
function ReviewsSection({ sellerId, listingId, orderId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (listingId) {
        res = await apiClient.get(`/reviews/listing/${listingId}`);
      } else {
        res = await apiClient.get(`/reviews/seller/${sellerId}`);
      }
      const loaded = res.data?.data?.reviews ?? [];
      setReviews(loaded);
      if (user) {
        setHasReviewed(loaded.some((r) => (r.reviewer?._id ?? r.reviewer?.id) === user.id));
      }
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (sellerId) load(); }, [sellerId, listingId, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setFormError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await apiClient.post('/reviews', {
        sellerId,
        listingId: listingId || undefined,
        orderId: orderId || undefined,
        rating,
        comment,
      });
      setRating(0);
      setComment('');
      setHasReviewed(true);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/reviews/${id}`);
      await load();
    } catch { /* ignore */ }
  };

  const canReview = user && user.id !== sellerId && !hasReviewed;

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {/* Write review form */}
      {canReview && (
        <form onSubmit={submit} className="rounded-xl border bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Write a review</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)…"
            maxLength={500}
            rows={3}
            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {hasReviewed && (
        <p className="text-sm text-slate-500 italic">You have already reviewed this seller.</p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading reviews…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-400">No reviews yet.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r._id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {r.reviewer?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.reviewer?.name}</p>
                    <StarDisplay value={r.rating} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  {user && (r.reviewer?._id === user.id || r.reviewer?.id === user.id) && (
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {r.comment && (
                <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ReviewsSection;
