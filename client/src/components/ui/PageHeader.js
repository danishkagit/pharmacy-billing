import React from 'react';

export default function PageHeader({ title, subtitle, icon, children }) {
  return (
    <div className="page-header animate-fade-up">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="color-block color-block-md grad-brand text-white flex-shrink-0 shadow-sm">
            <i className={`fas fa-${icon} text-sm`}></i>
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}