import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { getSocket } from '../../lib/socket';

function ChatPage() {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const socketRef = useRef(null);

  // Load message history
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/messages/${userId}`, {
        params: { page: 1, limit: 50 },
      });
      const msgs = res.data?.data?.messages ?? [];
      setMessages(msgs);
      // Extract other user from populated messages
      if (msgs.length > 0) {
        const first = msgs[0];
        const other =
          first.sender?._id === user?.id || first.sender?.id === user?.id
            ? first.receiver
            : first.sender;
        setOtherUser(other || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  // If no messages yet, try loading the user profile for the header
  useEffect(() => {
    if (!otherUser && userId) {
      apiClient.get(`/users/${userId}`)
        .then((res) => setOtherUser(res.data?.data?.user ?? null))
        .catch(() => {});
    }
  }, [userId, otherUser]);

  // Socket.io setup
  useEffect(() => {
    load();

    const sock = getSocket(token);
    socketRef.current = sock;

    // Join conversation room (sorted IDs so both sides use the same room)
    sock.emit('joinConversation', userId);

    // Real-time new message
    sock.on('newMessage', ({ message }) => {
      // Only append if it belongs to this conversation
      const senderId = message.sender?._id ?? message.sender?.id ?? message.sender;
      const receiverId = message.receiver?._id ?? message.receiver?.id ?? message.receiver;

      const isRelevant =
        (senderId === userId || receiverId === userId) ||
        (senderId === user?.id || receiverId === user?.id);

      if (isRelevant) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message.id)) return prev;
          return [...prev, {
            _id: message.id,
            sender: message.sender,
            receiver: message.receiver,
            content: message.content,
            listing: message.listing,
            isRead: message.isRead,
            createdAt: message.createdAt,
          }];
        });
      }
    });

    // Typing indicator
    sock.on('userTyping', ({ userId: typingUserId, isTyping: typing }) => {
      if (typingUserId === userId) {
        setIsTyping(typing);
      }
    });

    return () => {
      sock.emit('leaveConversation', userId);
      sock.off('newMessage');
      sock.off('userTyping');
    };
  }, [userId, token]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleTyping = (value) => {
    setContent(value);
    if (socketRef.current) {
      socketRef.current.emit('typing', { receiverId: userId, isTyping: true });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { receiverId: userId, isTyping: false });
      }, 1500);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError('');
    // Optimistic message
    const optimistic = {
      _id: `optimistic-${Date.now()}`,
      sender: { _id: user?.id, name: user?.name },
      receiver: { _id: userId },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const sentContent = content.trim();
    setContent('');

    // Stop typing indicator
    socketRef.current?.emit('typing', { receiverId: userId, isTyping: false });

    try {
      const res = await apiClient.post('/messages', {
        receiver: userId,
        content: sentContent,
      });
      // Replace optimistic with real message
      const real = res.data?.data?.message;
      if (real) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === optimistic._id
              ? { ...real, _id: real._id }
              : m
          )
        );
      }
    } catch (err) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setContent(sentContent);
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwn = (msg) => {
    const senderId = msg.sender?._id ?? msg.sender?.id ?? msg.sender;
    return senderId === user?.id;
  };

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link to="/dashboard/messages" className="text-slate-400 hover:text-slate-600">
          ←
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">
            {otherUser?.name ?? 'Conversation'}
          </h1>
          {isTyping && (
            <p className="text-xs text-emerald-600 animate-pulse">typing…</p>
          )}
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Loading messages…</p>
        ) : error ? (
          <p className="text-center text-sm text-red-500">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => {
            const own = isOwn(m);
            return (
              <div
                key={m._id}
                className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    own
                      ? 'rounded-tr-sm bg-emerald-600 text-white'
                      : 'rounded-tl-sm bg-slate-100 text-slate-900'
                  } ${m.optimistic ? 'opacity-70' : ''}`}
                >
                  {m.content}
                </div>
                <span className="mt-0.5 text-[10px] text-slate-400">
                  {m.createdAt ? formatTime(m.createdAt) : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="border-t px-3 py-2">
        {error && <p className="mb-1 text-[11px] text-red-500">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={content}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }}}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPage;
