import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function EInvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [filingHistory, setFilingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/gst/gstr1', { params: { month, year } }),
      API.get('/gst/filing-history')
    ]).then(([invRes, filingRes]) => {
      if (invRes.success) setInvoices(invRes.data?.b2b || []);
      if (filingRes.success) setFilingHistory(filingRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const generateEwayBill = async (invoice) => {
    setGenerating('eway-' + invoice.invoiceNo);
    setMessage(null);
    try {
      const res = await API.post('/gst/generate-ewaybill', { invoiceId: invoice._id || invoice.id });
      if (res.success) {
        setMessage({ type: 'success', text: `E-Way Bill ${res.data.ewbNo} generated. Valid till: ${new Date(res.data.validTill).toLocaleDateString('en-IN')}` });
        const filingRes = await API.get('/gst/filing-history');
        if (filingRes.success) setFilingHistory(filingRes.data || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.error || 'Failed to generate E-Way Bill' });
    }
    setGenerating(null);
  };

  const generateEInvoice = async (invoice) => {
    setGenerating('einv-' + invoice.invoiceNo);
    setMessage(null);
    try {
      const res = await API.post('/gst/generate-einvoice', { invoiceId: invoice._id || invoice.id });
      if (res.success) {
        setMessage({ type: 'success', text: `E-Invoice IRN: ${res.data.irn} (Ack No: ${res.data.ackNo})` });
        const filingRes = await API.get('/gst/filing-history');
        if (filingRes.success) setFilingHistory(filingRes.data || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.error || 'Failed to generate E-Invoice' });
    }
    setGenerating(null);
  };

  const getFilingForInvoice = (invoiceNo) => {
    return filingHistory.filter(f => f.referenceNo?.includes(invoiceNo));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">E-Invoice & E-Way Bill</h1>
      <p className="text-sm text-gray-500 mb-6">Generate IRN and E-Way Bill for B2B invoices above ₹50,000</p>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>{message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex gap-4 mb-6">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : invoices.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No B2B invoices found for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Invoice</th>
                  <th className="text-left p-3 font-medium">Customer GSTIN</th>
                  <th className="text-left p-3 font-medium">Customer Name</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Taxable</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">E-Invoice</th>
                  <th className="text-center p-3 font-medium">E-Way Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv, i) => {
                  const filings = getFilingForInvoice(inv.invoiceNo);
                  const hasEinvoice = filings.some(f => f.type === 'EINVOICE');
                  const hasEwaybill = filings.some(f => f.type === 'EWAYBILL');
                  return (
                    <tr key={i} className={`hover:bg-gray-50 ${inv.total >= 50000 ? 'bg-yellow-50' : ''}`}>
                      <td className="p-3 font-medium">{inv.invoiceNo}</td>
                      <td className="p-3 font-mono text-xs">{inv.gstin}</td>
                      <td className="p-3">{inv.name}</td>
                      <td className="p-3 text-gray-500">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right">₹{inv.taxable?.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">₹{inv.total?.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        {hasEinvoice ? (
                          <span className="text-green-600 text-xs"><i className="fas fa-check-circle mr-1"></i>Generated</span>
                        ) : (
                          <button onClick={() => generateEInvoice(inv)} disabled={generating === 'einv-' + inv.invoiceNo} className="text-blue-600 text-xs hover:underline disabled:opacity-50">
                            {generating === 'einv-' + inv.invoiceNo ? 'Generating...' : 'Generate IRN'}
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {hasEwaybill ? (
                          <span className="text-green-600 text-xs"><i className="fas fa-check-circle mr-1"></i>Generated</span>
                        ) : inv.total >= 50000 ? (
                          <button onClick={() => generateEwayBill(inv)} disabled={generating === 'eway-' + inv.invoiceNo} className="text-orange-600 text-xs hover:underline disabled:opacity-50">
                            {generating === 'eway-' + inv.invoiceNo ? 'Generating...' : 'Generate EWB'}
                          </button>
                        ) : <span className="text-gray-400 text-xs">N/A</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4">Filing History</h2>
        {filingHistory.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No filing history yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Reference No</th>
                  <th className="text-left p-3 font-medium">Period</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filingHistory.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.type === 'EINVOICE' ? 'bg-purple-100 text-purple-700' : f.type === 'EWAYBILL' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{f.type}</span>
                    </td>
                    <td className="p-3 font-mono text-xs">{f.referenceNo || '-'}</td>
                    <td className="p-3">{f.month}/{f.year}</td>
                    <td className="p-3 text-gray-500">{new Date(f.filedDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.status === 'filed' ? 'bg-green-100 text-green-700' : f.status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}