import { useState } from 'react';
import API from '../utils/api';

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
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Barcode Generator</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter text for barcode</label>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="e.g., medicine ID or product code" className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" onKeyDown={e => e.key === 'Enter' && generate()} />
          </div>
          <button onClick={generate} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Barcode'}
          </button>
          {barcode && (
            <div className="text-center p-6 border rounded-lg">
              <img src={barcode} alt="Barcode" className="mx-auto" />
              <p className="text-sm text-gray-500 mt-2">{text}</p>
              <button onClick={() => { const link = document.createElement('a'); link.download = `barcode-${text}.png`; link.href = barcode; link.click(); }} className="mt-4 text-blue-600 text-sm hover:underline"><i className="fas fa-download mr-1"></i>Download</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
