import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function ChatPage() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/messages/${userId}`, {
        params: { page: 1, limit: 50 },
      });
      setMessages(res.data?.data?.messages ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      await apiClient.post('/messages', {
        receiver: userId,
        content,
      });
      setContent('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col rounded-lg border bg-white text-sm shadow-sm">
      <header className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold text-slate-900">Conversation</h1>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="text-slate-600">Loading messages...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-600">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className="flex flex-col gap-0.5 text-xs">
              <span className="font-medium text-slate-800">{m.sender?.name}</span>
              <span className="rounded-md bg-slate-100 px-3 py-1 text-slate-800">
                {m.content}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t px-3 py-2">
        {error && (
          <p className="mb-1 text-[11px] text-red-600" aria-live="polite">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs outline-none ring-emerald-500 focus:ring-1"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPage;


