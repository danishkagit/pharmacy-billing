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
};

export function WorkspaceProvider({ children }) {
  // Retail-only build — single workspace mode. Company category is forced to retail elsewhere.
  const availableModes = useMemo(() => ['retail'], []);
  const isDual = false;

  const [mode, setModeState] = useState('retail');

  // Keep any legacy stored wholesale value harmlessly migrated to retail
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'retail') localStorage.setItem(STORAGE_KEY, 'retail');
    } catch {}
  }, []);

  const setMode = useCallback(() => {}, []);

  const toggleMode = useCallback(() => {}, []);

  const isWholesale = false;

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
