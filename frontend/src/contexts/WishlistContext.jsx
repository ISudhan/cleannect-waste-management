import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../auth/AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/wishlist');
      const ids = (res.data?.data?.wishlist?.listings ?? []).map(
        (item) => item.listing?._id || item.listing
      );
      setWishlistIds(new Set(ids));
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  const addToWishlist = async (listingId) => {
    await apiClient.post('/wishlist', { listingId });
    setWishlistIds((prev) => new Set([...prev, listingId]));
  };

  const removeFromWishlist = async (listingId) => {
    await apiClient.delete(`/wishlist/${listingId}`);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });
  };

  const toggleWishlist = async (listingId) => {
    if (wishlistIds.has(listingId)) {
      await removeFromWishlist(listingId);
    } else {
      await addToWishlist(listingId);
    }
  };

  const isWishlisted = (listingId) => wishlistIds.has(listingId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, loading, toggleWishlist, isWishlisted, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
