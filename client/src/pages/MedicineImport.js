import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassModal } from '../components/ui';

export default function MedicineImport() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bulking, setBulking] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [showSeed, setShowSeed] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSelected(new Set());
    setImportResult(null);
    try {
      const res = await API.get('/medicines/import/search-web', { params: { q: query.trim() } });
      if (res.success) setResults(res.data);
      else setError(res.error || 'Search failed');
    } catch (err) {
      setError(err?.error || 'Search failed. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((_, i) => i)));
  };

  const handleBulk = async () => {
    setBulking(true);
    setError('');
    setBulkResult(null);
    try {
      const res = await API.post('/medicines/import/bulk-scrape');
      if (res.success) setBulkResult(res.data);
      else setError(res.error || 'Bulk import failed');
    } catch (err) {
      setError(err?.error || 'Bulk import failed');
    } finally {
      setBulking(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    setError('');
    try {
      const res = await API.post('/medicines/import/seed-indian-medicines');
      if (res.success) setSeedResult(res.data);
      else setError(res.error || 'Seed failed');
    } catch (err) {
      setError(err?.error || 'Seed failed');
    } finally {
      setSeeding(false);
      setShowSeed(false);
    }
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    setError('');
    try {
      const meds = results.filter((_, i) => selected.has(i)).map(m => ({
        name: m.name, manufacturer: m.manufacturer, composition: m.composition,
        mrp: m.mrp, packSize: m.packSize, category: m.category, schedule: m.schedule
      }));
      const res = await API.post('/medicines/import/import', { medicines: meds });
      if (res.success) setImportResult(res.data);
      else setError(res.error || 'Import failed');
    } catch (err) {
      setError(err?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Import Medicines</h1>
        <button onClick={() => navigate('/medicines')} className="text-sm text-gray-500 hover:text-gray-700">
          <i className="fas fa-arrow-left mr-1"></i> Back to Medicines
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 glass-card p-5">
          <div className="flex gap-3">
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search medicine name (e.g., paracetamol, amoxicillin)..."
              className="glass-input"
            />
            <button onClick={handleSearch} disabled={loading || !query.trim()} className="btn-primary">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              Search
            </button>
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-center">
          <button onClick={handleBulk} disabled={bulking} className="btn-primary bg-purple-600 hover:bg-purple-700">
            {bulking ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-database"></i>}
            {bulking ? 'Importing...' : 'Bulk from PharmEasy'}
          </button>
          {bulkResult && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Found {bulkResult.uniqueFound}, imported {bulkResult.imported} new
            </div>
          )}
        </div>

        <div className="glass-card p-5 flex flex-col justify-center">
          <button onClick={() => setShowSeed(true)} disabled={seeding} className="btn-success">
            {seeding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-seedling"></i>}
            {seeding ? 'Seeding...' : 'Seed Indian Meds 2026'}
          </button>
          {seedResult && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Imported {seedResult.imported} of {seedResult.total}
            </div>
          )}
        </div>
      </div>

      {error && !importResult && (
        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selected.size === results.length} onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-600">{results.length} medicines found</span>
            </div>
            <button onClick={handleImport} disabled={selected.size === 0 || importing}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {importing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
              Import Selected ({selected.size})
            </button>
          </div>

          {importResult && (
            <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
              <p className="font-medium text-green-800">
                <i className="fas fa-check-circle mr-1"></i>
                Imported {importResult.created} medicine(s) successfully
              </p>
              {importResult.errors?.length > 0 && (
                <div className="mt-2 text-yellow-700">
                  <p className="font-medium">{importResult.errors.length} skipped:</p>
                  <ul className="list-disc list-inside text-xs mt-1">
                    {importResult.errors.slice(0, 5).map((e, i) => (
                      <li key={i}>{e.name}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {results.map((med, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${selected.has(i) ? 'bg-blue-50' : ''}`}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{med.name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    {med.manufacturer && <span>{med.manufacturer}</span>}
                    {med.composition && <span>{med.composition}</span>}
                    {med.packSize && <span>{med.packSize}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${med.schedule === 'OTC' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{med.schedule}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {med.mrp > 0 && <div className="font-medium text-gray-800">₹{med.mrp.toFixed(2)}</div>}
                  <span className="text-xs text-gray-400 capitalize">{med.category}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{selected.size} of {results.length} selected</span>
            <button onClick={handleImport} disabled={selected.size === 0 || importing}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {importing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-download"></i>}
              Import Selected ({selected.size})
            </button>
          </div>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="glass-card text-center py-16">
          <i className="fas fa-search text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-400">Search for a medicine name or use bulk import options</p>
        </div>
      )}

      {/* Seed Confirmation Modal */}
      <GlassModal open={showSeed} onClose={() => setShowSeed(false)} title="Seed Indian Medicines 2026" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          This will import <strong>506 common Indian medicines</strong> into your catalog, including all major brands
          across pain/fever, antibiotics, cardiac, diabetes, respiratory, vitamins, and more therapeutic categories.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-morph-xs p-3 text-xs text-amber-700 mb-4 flex items-start gap-2">
          <i className="fas fa-info-circle mt-0.5"></i>
          <span>Medicines that already exist in your catalog will be skipped.</span>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowSeed(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSeed} disabled={seeding} className="btn-success">
            {seeding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
            {seeding ? 'Importing...' : 'Confirm Import'}
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
