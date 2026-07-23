export default function GlassTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-morph-xs p-1 gap-0.5">
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-morph-xs text-sm font-medium transition-all duration-200
            ${active === tab.key
              ? 'bg-white text-primary-600 shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}>
          {tab.icon && <i className={`fas fa-${tab.icon} mr-1.5`}></i>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
