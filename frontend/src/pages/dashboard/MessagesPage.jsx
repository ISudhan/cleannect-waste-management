import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function MessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Handle navigation from listing detail page
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
        if (!cancelled) {
          setConversations(res.data?.data?.conversations ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load conversations.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          View your conversations with buyers and sellers.
        </p>
      </header>
      <div className="rounded-lg border bg-white text-sm shadow-sm">
        {loading ? (
          <div className="p-4 text-slate-600">Loading conversations...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-slate-600">No conversations yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {conversations.map((conv) => (
              <li key={conv.user?.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{conv.user?.name}</p>
                  <p className="text-xs text-slate-600">{conv.lastMessage?.content}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {conv.unreadCount} new
                    </span>
                  )}
                  <Link
                    to={`/dashboard/messages/${conv.user?.id}`}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;


