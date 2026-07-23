import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function GSTR1Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    API.get('/gst/gstr1', { params: { month, year } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">GSTR-1 Report</h1>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-6">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : data && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="text-2xl font-bold">{data.data.summary.totalInvoices}</p><p className="text-sm text-gray-500">Total Invoices</p></div>
              <div className="p-4 bg-purple-50 rounded-lg text-center"><p className="text-2xl font-bold">{data.data.b2b.length}</p><p className="text-sm text-gray-500">B2B</p></div>
              <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-2xl font-bold">{data.data.b2c.length}</p><p className="text-sm text-gray-500">B2C</p></div>
            </div>
            <div className="text-right text-lg font-bold">Total Sales: ₹{data.data.summary.totalSales?.toFixed(2)}</div>

            <h3 className="font-semibold">HSN Summary</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr><th className="p-2 text-left">GST Rate</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Taxable</th><th className="p-2 text-right">CGST</th><th className="p-2 text-right">SGST</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.hsnSummary.map((h, i) => (
                  <tr key={i}><td className="p-2">{h.gstRate}%</td><td className="p-2 text-right">{h.qty}</td><td className="p-2 text-right">₹{h.taxableValue?.toFixed(2)}</td><td className="p-2 text-right">₹{h.cgst?.toFixed(2)}</td><td className="p-2 text-right">₹{h.sgst?.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
