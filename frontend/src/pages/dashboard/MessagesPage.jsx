import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function MessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.receiverId) {
      navigate(`/dashboard/messages/${location.state.receiverId}`, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/messages');
        if (!cancelled) setConversations(res.data?.data?.conversations ?? []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load conversations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="section-title">Messages</h1>
        <p className="section-subtitle">Your conversations with buyers and sellers.</p>
      </div>

      {loading ? (
        <div className="empty-state card">
          <div className="spinner mx-auto" />
          <p className="text-sm text-slate-400 mt-2">Loading conversations…</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-sm text-red-600">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-state-icon">💬</p>
          <p className="text-base font-semibold text-slate-700">No conversations yet</p>
          <p className="text-sm text-slate-400">Browse listings and contact sellers to start chatting.</p>
          <Link to="/" className="btn-primary mt-2">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-50">
            {conversations.map((conv) => (
              <li key={conv.user?.id}>
                <Link
                  to={`/dashboard/messages/${conv.user?.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                    {conv.user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {conv.user?.name}
                      </p>
                      <span className="text-xs text-slate-400">{timeAgo(conv.lastMessage?.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {conv.lastMessage?.content || 'Start the conversation'}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
