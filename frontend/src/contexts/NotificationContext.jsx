import { createContext, useContext, useEffect, useRef, useState } from 'react';
import apiClient from '../lib/apiClient';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from '../auth/AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Load notifications when user is logged in
  useEffect(() => {
    if (user) {
      loadNotifications();
      // Connect socket and listen for new notifications
      const sock = getSocket(token);
      socketRef.current = sock;

      sock.on('newNotification', ({ notification }) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    } else {
      setNotifications([]);
      setUnreadCount(0);
      disconnectSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('newNotification');
      }
    };
  }, [user, token]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data?.data?.notifications ?? []);
      setUnreadCount(res.data?.data?.unreadCount ?? 0);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const deleteNotification = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch { /* ignore */ }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, loadNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
