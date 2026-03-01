import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const typeIcon = {
  order: '📦',
  message: '💬',
  offer: '💰',
  review: '⭐',
  system: '🔔',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationsPage() {
  const { notifications, loading, markRead, markAllRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="text-sm text-emerald-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-3xl">🔔</p>
          <p className="mt-2 text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition hover:shadow-sm ${
                !n.isRead ? 'border-emerald-200 bg-emerald-50/40' : ''
              }`}
              onClick={() => handleClick(n)}
            >
              <span className="mt-0.5 text-xl">{typeIcon[n.type] ?? '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                  className="text-slate-300 hover:text-red-400"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificationsPage;
