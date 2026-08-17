import { useState } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard } from '../components/ui';

export default function BarcodeGenerator() {
  const [text, setText] = useState('');
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await API.post('/barcode/generate', { text, options: { bcid: 'code128', scale: 3, height: 15 } });
      if (res.success) setBarcode(res.data.barcode);
    } catch (err) { alert(err?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <PageHeader icon="barcode" title="Barcode Generator" subtitle="Create Code 128 barcodes for products" />
      <GlassCard>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Enter text for barcode</label>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="e.g., medicine ID or product code" className="glass-input" onKeyDown={e => e.key === 'Enter' && generate()} />
          </div>
          <button onClick={generate} disabled={loading} className="btn btn-primary btn-glow">
            <i className="fas fa-barcode mr-1"></i>{loading ? 'Generating...' : 'Generate Barcode'}
          </button>
          {barcode && (
            <div className="text-center p-6 surface-2 rounded-xl animate-fade-up">
              <img src={barcode} alt="Barcode" className="mx-auto" />
              <p className="text-sm text-slate-500 mt-2">{text}</p>
              <button onClick={() => { const link = document.createElement('a'); link.download = `barcode-${text}.png`; link.href = barcode; link.click(); }} className="mt-4 btn btn-ghost btn-sm text-pharma-600"><i className="fas fa-download mr-1"></i>Download</button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
