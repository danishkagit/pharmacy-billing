export default function GlassTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${active === tab.key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}>
          {tab.icon && <i className={`fas fa-${tab.icon} mr-1.5`}></i>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
