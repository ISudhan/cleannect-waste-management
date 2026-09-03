import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../contexts/CartContext';
import GeminiEcoChatWidget from '../components/GeminiEcoChatWidget';

const navCategories = [
  { id: '', label: 'All Categories' },
  { id: 'plastic', label: 'Plastics (PET/HDPE)' },
  { id: 'metal', label: 'Scrap Metals' },
  { id: 'paper', label: 'Paper & Cardboard' },
  { id: 'electronic', label: 'E-Waste' },
  { id: 'glass', label: 'Glass Cullet' },
  { id: 'organic', label: 'Organic Biomass' },
];

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedSearchCat, setSelectedSearchCat] = useState('');
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [selectedCity] = useState('Bengaluru, Karnataka');

  // Handle header search form submit (navigates to marketplace with filters)
  function handleHeaderSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (headerSearchQuery.trim()) params.set('search', headerSearchQuery.trim());
    if (selectedSearchCat) params.set('category', selectedSearchCat);
    navigate(`/?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* ── Top Announcement Bar ── */}
      <div className="bg-slate-950 text-slate-300 text-[11px] font-medium py-1.5 px-4 border-b border-slate-800">
        <div className="page-container flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <span className="truncate">
              ⚡ <strong>CleanNect Spot Pickup:</strong> Verified recyclable scrap lots, bulk plastics, and metals at live spot rates.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 flex-shrink-0">
            <span>🛡️ 100% Verified Escrow Protection</span>
            <span>•</span>
            <span>Same-Day Pickup Available</span>
          </div>
        </div>
      </div>

      {/* ── Clean Amazon-Style Main Header ── */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="page-container py-2.5 flex items-center justify-between gap-3 md:gap-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl md:text-2xl font-black tracking-tight text-white hover:text-emerald-400 transition-colors flex-shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-base font-black shadow-md">
              C
            </span>
            <div className="leading-none">
              <span className="font-extrabold text-white">Clean</span>
              <span className="font-extrabold text-emerald-400">nect</span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-emerald-300 tracking-wider ml-1 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                MARKET
              </span>
            </div>
          </Link>

          {/* Delivery / Location Picker */}
          <div className="hidden lg:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-transparent">
            <span className="text-base text-emerald-400">📍</span>
            <div className="leading-tight">
              <p className="text-[10px] text-slate-400">Pickup in</p>
              <p className="font-bold text-white max-w-[130px] truncate">{selectedCity}</p>
            </div>
          </div>

          {/* Amazon-Style Search Bar */}
          <form
            onSubmit={handleHeaderSearch}
            className="flex-1 flex items-center max-w-2xl bg-white rounded-xl overflow-hidden shadow-inner border-2 border-transparent focus-within:border-emerald-500 transition"
          >
            {/* Category Dropdown */}
            <select
              value={selectedSearchCat}
              onChange={(e) => setSelectedSearchCat(e.target.value)}
              className="hidden sm:block bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-3 border-r border-slate-200 focus:outline-none cursor-pointer"
            >
              {navCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Input Field */}
            <input
              type="text"
              placeholder="Search recyclable scrap (PET plastic, copper wire, cardboard)..."
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
            />

            {/* Search Submit Button */}
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 text-xs flex items-center justify-center transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            {/* Account & Lists */}
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800 border border-slate-700/60 transition text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-[10px] text-slate-400">Hello, {user.name?.split(' ')[0]}</p>
                  <p className="text-xs font-bold text-white">Dashboard</p>
                </div>
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-800 border border-slate-700 transition text-left"
              >
                <div className="leading-tight">
                  <p className="text-[10px] text-slate-400">Hello, Sign in</p>
                  <p className="text-xs font-bold text-white">Account & Orders</p>
                </div>
              </Link>
            )}

            {/* Cart Icon (Amazon style) */}
            <Link
              to="/cart"
              className="relative flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
            >
              <span className="text-base">🛒</span>
              <span className="hidden sm:inline-block">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Clean Scrap Category Sub-Navigation Bar ── */}
        <div className="bg-slate-800/90 border-t border-slate-700/60 text-xs px-4 py-2 hidden md:block">
          <div className="page-container flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-5 text-slate-300 font-medium whitespace-nowrap">
              <Link to="/" className="flex items-center gap-1 text-white font-bold hover:text-emerald-400 transition">
                <span>☰</span>
                <span>All Scrap Categories</span>
              </Link>
              <Link to="/?category=plastic" className="hover:text-emerald-400 transition">
                Plastics (PET/HDPE)
              </Link>
              <Link to="/?category=metal" className="hover:text-emerald-400 transition">
                Scrap Metals
              </Link>
              <Link to="/?category=paper" className="hover:text-emerald-400 transition">
                Paper & Cardboard
              </Link>
              <Link to="/?category=electronic" className="hover:text-emerald-400 transition">
                E-Waste
              </Link>
              <Link to="/?category=glass" className="hover:text-emerald-400 transition">
                Glass Cullet
              </Link>
              <Link to="/?category=organic" className="hover:text-emerald-400 transition">
                Organic Biomass
              </Link>
            </div>

            <div className="flex items-center gap-3 text-slate-400 text-xs whitespace-nowrap">
              <Link to="/dashboard/listings/new" className="text-emerald-400 hover:text-emerald-300 font-bold">
                + Sell Scrap
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3 lg:hidden animate-fade-in text-sm text-slate-300">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block font-bold text-white py-1">
              🛒 All Scrap Listings
            </Link>
            <Link to="/?category=plastic" onClick={() => setMobileOpen(false)} className="block py-1">
              Plastics (PET/HDPE)
            </Link>
            <Link to="/?category=metal" onClick={() => setMobileOpen(false)} className="block py-1">
              Scrap Metals
            </Link>
            <Link to="/?category=paper" onClick={() => setMobileOpen(false)} className="block py-1">
              Paper & Cardboard
            </Link>
            <Link to="/?category=electronic" onClick={() => setMobileOpen(false)} className="block py-1">
              E-Waste
            </Link>
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="block py-1 font-bold text-amber-400">
              🛒 Cart ({cartCount} items)
            </Link>

            {user ? (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-emerald-400 font-bold py-1">
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="block text-left text-rose-400 py-1 font-semibold"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 rounded-xl bg-slate-800 text-white font-bold text-xs">
                  Log In
                </Link>
                <Link to="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Main Page Content ── */}
      <main className="flex-1">
        <div className="page-container py-6">
          <Outlet />
        </div>
      </main>

      {/* ── Clean E-Commerce Footer ── */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        {/* Back to top banner */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 text-center text-xs font-bold transition border-b border-slate-700"
        >
          ▲ Back to top
        </button>

        <div className="page-container py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-white font-bold text-sm mb-2.5">Scrap Categories</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/?category=plastic" className="hover:text-emerald-400">PET & HDPE Plastics</Link></li>
              <li><Link to="/?category=metal" className="hover:text-emerald-400">Copper & Scrap Metals</Link></li>
              <li><Link to="/?category=paper" className="hover:text-emerald-400">Cardboard & Paper</Link></li>
              <li><Link to="/?category=electronic" className="hover:text-emerald-400">E-Waste & Electronics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-2.5">Buy & Sell</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/" className="hover:text-emerald-400">Browse Marketplace</Link></li>
              <li><Link to="/dashboard/listings/new" className="hover:text-emerald-400">Sell Recyclables</Link></li>
              <li><Link to="/cart" className="hover:text-emerald-400">Shopping Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-2.5">Account & Orders</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/auth/login" className="hover:text-emerald-400">Sign In</Link></li>
              <li><Link to="/auth/register" className="hover:text-emerald-400">Register Account</Link></li>
              <li><Link to="/dashboard/orders" className="hover:text-emerald-400">Your Orders</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-2.5">Trust & Quality</h4>
            <ul className="space-y-1.5 text-xs">
              <li><span className="text-emerald-400 font-bold">✓ 100% Verified Sellers</span></li>
              <li><span>✓ Same-Day Pickup</span></li>
              <li><span>✓ Secure Payment Escrow</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 text-center text-slate-500 text-[11px]">
          © {new Date().getFullYear()} CleanNect — India's Recyclable Scrap & Waste Marketplace. All Rights Reserved.
        </div>
      </footer>

      {/* Floating Gemini AI Eco-Bot */}
      <GeminiEcoChatWidget />
    </div>
  );
}
