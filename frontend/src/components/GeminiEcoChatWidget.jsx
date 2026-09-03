import { useState, useRef, useEffect } from 'react';
import apiClient from '../lib/apiClient';

const samplePrompts = [
  '💡 How to make wealth from plastic bottles?',
  '💰 Scrap price for copper & aluminum in India?',
  '🗺️ How to save KM collecting from 3 members?',
  '🌱 Upcycling cardboard boxes into useful items',
];

export default function GeminiEcoChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedImageBase64, setAttachedImageBase64] = useState(null);
  const [attachedImageMimeType, setAttachedImageMimeType] = useState('image/jpeg');
  const [attachedImagePreview, setAttachedImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Image attachment in chat (clean raw base64 extraction)
  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('Please select an image smaller than 20MB.');
        return;
      }
      setAttachedImageMimeType(file.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onloadend = () => {
        const fullDataUrl = reader.result;
        setAttachedImagePreview(fullDataUrl);
        // Strip data:...;base64, prefix for clean API transmission
        const base64Data = fullDataUrl.includes(';base64,')
          ? fullDataUrl.split(';base64,')[1]
          : fullDataUrl;
        setAttachedImageBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeAttachedImage() {
    setAttachedImageBase64(null);
    setAttachedImagePreview(null);
    setAttachedImageMimeType('image/jpeg');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Send message to Gemini chat API
  async function handleSendMessage(customPrompt = null) {
    const textToSend = customPrompt || inputText;
    if ((!textToSend || !textToSend.trim()) && !attachedImageBase64) return;
    if (sending) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      image: attachedImagePreview,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const imageToSend = attachedImageBase64;
    const mimeToSend = attachedImageMimeType;
    removeAttachedImage();
    setSending(true);

    try {
      // Build safe conversation history (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        sender: m.sender === 'user' ? 'user' : 'model',
        text: m.text || '',
      }));

      const res = await apiClient.post('/gemini/chat', {
        message: textToSend,
        history,
        imageBase64: imageToSend,
        mimeType: mimeToSend,
      });

      const fullText = res.data?.answer || res.data?.data?.reply;
      if (res.data?.success && fullText) {
        const botId = `bot-${Date.now()}`;

        // Initialize empty bot message
        setMessages((prev) => [
          ...prev,
          {
            id: botId,
            sender: 'bot',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setSending(false);

        // Real-Time Word-by-Word Stream
        const words = fullText.split(' ');
        let accumulated = '';
        let wIdx = 0;

        const streamInterval = setInterval(() => {
          if (wIdx < words.length) {
            accumulated += (wIdx === 0 ? '' : ' ') + words[wIdx];
            const currentText = accumulated;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === botId ? { ...msg, text: currentText } : msg))
            );
            wIdx++;
          } else {
            clearInterval(streamInterval);
          }
        }, 15);
        return;
      } else {
        throw new Error('Invalid response from Gemini');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text:
          err.response?.data?.error ||
          err.response?.data?.message ||
          '⚠️ AI service is temporarily unavailable. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* ── Chat Window Modal ── */}
      {isOpen ? (
        <div className="flex flex-col w-[360px] md:w-[410px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow">
                ✨
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  CleanNect AI Eco-Bot
                </h3>
                <p className="text-[10px] text-emerald-300 font-medium">
                  Real-time Gemini 3.6 Flash
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-400 my-auto">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black shadow-sm">
                  ✨
                </div>
                <p className="text-xs font-bold text-slate-800">CleanNect Gemini AI is Ready</p>
                <p className="text-[11px] text-slate-500 max-w-[240px]">
                  Ask about waste segregation, recycling rates, Wealth out of Waste blueprints, or attach a photo 📸.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt="Attached waste"
                        className="w-full max-h-36 object-cover rounded-lg mb-2 border border-black/10"
                      />
                    )}
                    <div className="whitespace-pre-wrap font-sans space-y-1">
                      {m.text.split('\n').map((line, lIdx) => {
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p
                            key={lIdx}
                            className={line.startsWith('•') || line.startsWith('-') ? 'pl-2' : ''}
                          >
                            {parts.map((part, pIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={pIdx} className="font-bold">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1.5 text-slate-400 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium ml-1">
                    Gemini thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {samplePrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-[10px] font-medium text-slate-600 hover:text-emerald-700 transition border border-slate-200 whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Attached Image Preview Bar */}
          {attachedImagePreview && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImagePreview}
                  alt="Attachment"
                  className="h-8 w-8 rounded-lg object-cover border border-emerald-200"
                />
                <span className="text-xs text-emerald-800 font-medium truncate max-w-[180px]">
                  Photo attached for inspection
                </span>
              </div>
              <button
                onClick={removeAttachedImage}
                className="text-xs text-slate-400 hover:text-rose-500 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Attach waste photo"
              >
                📷
              </button>

              <input
                type="text"
                placeholder="Ask about scrap value, upcycling, routes..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={sending || (!inputText.trim() && !attachedImageBase64)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow disabled:opacity-40"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Floating Trigger Bubble */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-slate-900 text-white p-3 pr-4 shadow-2xl border-2 border-emerald-400 hover:scale-105 transition-all duration-300"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black shadow-md">
            ✨
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">Wealth out of Waste</p>
            <p className="text-[10px] text-emerald-400 font-medium">Gemini 3.6 AI</p>
          </div>
        </button>
      )}
    </div>
  );
}