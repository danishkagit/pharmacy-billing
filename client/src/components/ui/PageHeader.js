export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header animate-fade-up">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}