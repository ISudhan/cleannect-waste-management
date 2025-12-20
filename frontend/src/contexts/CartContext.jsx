import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      // Clear cart when user logs out
      setCart(null);
    }
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/carts');
      setCart(res.data?.data?.cart ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (listingId, quantity) => {
    if (!user) {
      throw new Error('You must be logged in to add items to cart');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/carts/items', {
        listingId,
        quantity: parseFloat(quantity),
      });
      setCart(res.data?.data?.cart ?? null);
      return res.data?.data?.cart;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add item to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) {
      throw new Error('You must be logged in to update cart');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.put(`/carts/items/${itemId}`, {
        quantity: parseFloat(quantity),
      });
      setCart(res.data?.data?.cart ?? null);
      return res.data?.data?.cart;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update cart item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) {
      throw new Error('You must be logged in to remove items from cart');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.delete(`/carts/items/${itemId}`);
      setCart(res.data?.data?.cart ?? null);
      return res.data?.data?.cart;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) {
      throw new Error('You must be logged in to clear cart');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.delete('/carts');
      setCart(res.data?.data?.cart ?? null);
      return res.data?.data?.cart;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    error,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}

