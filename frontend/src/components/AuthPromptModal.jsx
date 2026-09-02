import { Link } from 'react-router-dom';

export default function AuthPromptModal({ isOpen, onClose, title = 'Sign In to Continue', message = 'Please sign in or create a CleanNect account to purchase, add items to cart, or submit an offer.', actionType = 'purchase', redirectUrl }) {
  if (!isOpen) return null;

  const targetRedirect = redirectUrl || window.location.pathname;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          ✕
        </button>

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-2xl font-black shadow-lg shadow-emerald-600/30 mb-3">
            C
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-1">
            CleanNect Marketplace
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-xs md:text-sm text-slate-500 leading-relaxed max-w-sm">
            {message}
          </p>
        </div>

        {/* Perks Box */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-emerald-600">✓</span>
            <span>Instant order confirmation & live tracking</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-emerald-600">✓</span>
            <span>Optimized nearby pickup routes (Save KM & fuel)</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-emerald-600">✓</span>
            <span>Verified industrial buyers & escrow protection</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Link
            to={`/auth/login?redirect=${encodeURIComponent(targetRedirect)}`}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm transition shadow-lg shadow-emerald-600/25 active:scale-95"
          >
            <span>Sign In to Your Account</span>
            <span className="text-xs">→</span>
          </Link>

          <Link
            to={`/auth/register?redirect=${encodeURIComponent(targetRedirect)}`}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm transition active:scale-95"
          >
            <span>New Customer? Create Account Free</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
}
