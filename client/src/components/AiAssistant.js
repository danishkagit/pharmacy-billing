import { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

export default function AiAssistant() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    let active = true;
    API.get('/ai/status').then(r => {
      if (active && r.success) setEnabled(r.data.enabled);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, busy]);

  if (!enabled) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const res = await API.post('/ai/assistant', { message: text });
      setMessages(m => [...m, { role: 'ai', text: res.success ? res.data.reply : (res.error || 'Something went wrong') }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'ai', text: err?.error || 'Failed to reach the assistant' }]);
    }
    finally { setBusy(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full grad-hero text-white shadow-glow flex items-center justify-center hover:scale-105 transition-transform"
        title="Ask PharmaGPT"
      >
        <i className="fas fa-robot text-xl"></i>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-white/70 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 grad-hero text-white">
            <i className="fas fa-robot"></i>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">PharmaGPT</p>
              <p className="text-[10px] opacity-80">AI assistant • billing, GST, inventory</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20"><i className="fas fa-times text-sm"></i></button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[18rem] max-h-[24rem] bg-slate-50/50">
            {messages.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
                Hi! Ask me anything about billing, GST slabs,<br />inventory, expiry or drug schedules.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto grad-brand text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-slate-400 inline-flex items-center gap-1.5"><span className="animate-spin inline-block h-3 w-3 border-b-2 border-pharma-500 rounded-full"></span>Thinking…</div>}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-slate-200 bg-white">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Ask PharmaGPT…"
              className="glass-input text-sm flex-1"
            />
            <button onClick={send} disabled={busy || !input.trim()} className="w-9 h-9 rounded-full grad-hero text-white flex items-center justify-center disabled:opacity-40">
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}