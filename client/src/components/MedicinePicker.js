import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import API from '../utils/api';
import QuickAddMedicine from './QuickAddMedicine';

/**
 * MedicinePicker — salt/composition-aware autocomplete for selecting a medicine.
 * Typing (>=3 chars) searches by medicine name, salt/composition and manufacturer.
 * The dropdown shows brand name + salt composition + manufacturer.
 *
 * Props:
 *  value            - selected medicine _id (or you manage selection via onSelect)
 *  onSelect(med)    - called with the full medicine object when a row is chosen
 *  onClear()        - optional, when the user clears the current selection
 *  placeholder      - input placeholder
 *  autoFocus        - focus the input on mount
 *  hitEnterSelect   - if only one suggestion, select on Enter
 */
export default function MedicinePicker({ value, onSelect, onClear, placeholder = 'Search medicine by name or salt (min 3 chars)', autoFocus = false, compact = false, hitEnterSelect = true }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [selectedId, setSelectedId] = useState(value || '');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const ref = useRef(null);
  const boxRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => { setSelectedId(value || ''); }, [value]);

  const search = (q) => {
    clearTimeout(timer.current);
    if (!q || q.trim().length < 3) { setOptions([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await API.get('/medicines/suggest', { params: { q } });
        if (res.success) {
          setOptions(res.data || []);
          setActive(-1);
          setOpen(true);
        }
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleInput = (e) => { const v = e.target.value; setQuery(v); setSelectedId(''); search(v); };

  const choose = (med) => {
    setSelectedId(med._id);
    setQuery(med.name);
    setOpen(false);
    if (onSelect) onSelect(med);
  };

  const highlight = (text, q) => {
    if (!q) return text;
    const i = (text || '').toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <span className="bg-teal-100 text-teal-800 rounded px-0.5">{text.slice(i, i + q.length)}</span>
        {text.slice(i + q.length)}
      </>
    );
  };

  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (!open || options.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % options.length); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a <= 0 ? options.length - 1 : a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && options[active]) choose(options[active]); else if (hitEnterSelect && options.length === 1) choose(options[0]); }
      else if (e.key === 'Escape') { setOpen(false); }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open, options, active]);

  const handleQuickAddCreated = (med) => {
    setQuery(med.name);
    setSelectedId(med._id);
    if (onSelect) onSelect(med);
  };

  const [dropPos, setDropPos] = useState(null);

  const updateDropPos = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 260) });
    }
  };

  useEffect(() => {
    if (open) updateDropPos();
  }, [open, options, loading]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateDropPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
  }, [open]);

  const dropdown = open && dropPos && createPortal(
    <div
      className="fixed z-[9999] max-h-72 overflow-y-auto bg-white rounded-lg shadow-lg border border-slate-200"
      style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}
    >
      {loading && (
        <div className="px-3 py-3 text-xs text-slate-400"><i className="fas fa-spinner fa-spin mr-1"></i>Searching...</div>
      )}
      {!loading && options.length === 0 && (
        <div className="px-3 py-3">
          <p className="text-xs text-slate-400 mb-2">
            <i className="fas fa-info-circle mr-1"></i>No medicines match. Try the brand or salt name.
          </p>
          <button
            type="button"
            onClick={() => { setOpen(false); setShowQuickAdd(true); }}
            className="w-full text-left px-3 py-2 rounded-lg bg-pharma-50 text-pharma-700 text-xs font-medium hover:bg-pharma-100 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus-circle"></i>Add "{query}" as new medicine
          </button>
        </div>
      )}
      {options.map((m, i) => (
        <button
          key={m._id}
          type="button"
          onMouseEnter={() => setActive(i)}
          onClick={() => choose(m)}
          className={`w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors ${i === active ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
        >
          <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
            {highlight(m.name, query)}
            {m.schedule === 'H' && <span className="badge badge-yellow">H</span>}
            {m.schedule === 'H1' && <span className="badge badge-purple">H1</span>}
            {m.schedule === 'X' && <span className="badge badge-red">X</span>}
            {m.schedule === 'OTC' && <span className="badge badge-green">OTC</span>}
          </span>
          {m.composition && <span className="text-xs text-slate-500 truncate"><i className="fas fa-pills mr-1 text-teal-400 text-[10px]"></i>{highlight(m.composition, query)}</span>}
          <span className="flex items-center gap-2 text-[11px] text-slate-400">
            {m.manufacturer && <span>{m.manufacturer}</span>}
            {m.gstRate ? <span>GST {m.gstRate}%</span> : null}
          </span>
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <>
      <div className="relative w-full" ref={boxRef}>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            ref={ref}
            autoFocus={autoFocus}
            value={query}
            onChange={handleInput}
            onFocus={() => { if (query && options.length) setOpen(true); }}
            placeholder={placeholder}
            className={`glass-input pl-8 pr-8 ${compact ? 'text-xs py-1.5' : ''}`}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setOptions([]); setOpen(false); if (onClear) onClear(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5">
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      </div>
      {dropdown}
      <QuickAddMedicine
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onCreated={handleQuickAddCreated}
        prefillName={query}
      />
    </>
  );
}
