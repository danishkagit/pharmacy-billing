export default function GlassTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex max-w-full flex-wrap bg-white/60 backdrop-blur-md rounded-xl p-1 gap-0.5 shadow-sm border border-white/70">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
            ${active === tab.key
              ? 'grad-brand text-white shadow-glow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/70'
            }`}>
          {tab.icon && <i className={`fas fa-${tab.icon} mr-1.5`}></i>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}