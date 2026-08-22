import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

const STORAGE_KEY = 'crx_workspace_mode';

export const MODE_META = {
  retail: {
    id: 'retail',
    label: 'Retail Counter',
    shortLabel: 'Retail',
    icon: 'cash-register',
    tagline: 'Walk-in POS billing · Prescriptions · Loyalty',
    chipClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  wholesale: {
    id: 'wholesale',
    label: 'Wholesale Desk',
    shortLabel: 'Wholesale',
    icon: 'truck-ramp-box',
    tagline: 'B2B invoicing · Purchases · Distributor credit',
    chipClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
};

export function WorkspaceProvider({ children }) {
  const { company } = useAuth();

  const category = company?.drugLicenseCategory || 'both';

  const availableModes = useMemo(() => {
    if (category === 'retail') return ['retail'];
    if (category === 'wholesale') return ['wholesale'];
    return ['retail', 'wholesale'];
  }, [category]);

  const isDual = availableModes.length > 1;

  const [mode, setModeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'retail' || saved === 'wholesale') return saved;
    } catch {}
    return 'retail';
  });

  // Clamp stored mode to what the company's drug license actually permits
  useEffect(() => {
    setModeState(prev => (availableModes.includes(prev) ? prev : availableModes[0]));
  }, [availableModes]);

  const setMode = useCallback((next) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'retail' ? 'wholesale' : 'retail';
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const isWholesale = mode === 'wholesale';

  return (
    <WorkspaceContext.Provider value={{ mode, setMode, toggleMode, availableModes, isDual, isWholesale, meta: MODE_META[mode] }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}

export default WorkspaceContext;
