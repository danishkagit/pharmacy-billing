import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function GSTR3BReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    API.get('/gst/gstr3b', { params: { month, year } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">GSTR-3B Report</h1>
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
              <div className="p-4 bg-green-50 rounded-lg text-center"><p className="text-xl font-bold text-green-700">₹{data.sales?.totalTaxable?.toFixed(2)}</p><p className="text-sm text-gray-500">Sales Taxable</p></div>
              <div className="p-4 bg-blue-50 rounded-lg text-center"><p className="text-xl font-bold text-blue-700">₹{data.sales?.totalTax?.toFixed(2)}</p><p className="text-sm text-gray-500">Output Tax</p></div>
              <div className="p-4 bg-purple-50 rounded-lg text-center"><p className="text-xl font-bold text-purple-700">₹{data.purchases?.totalTax?.toFixed(2)}</p><p className="text-sm text-gray-500">Input Tax Credit</p></div>
            </div>
            <div className={`p-6 rounded-lg text-center ${data.netTaxLiability >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-500">Net Tax Liability (Output - Input Credit)</p>
              <p className={`text-3xl font-bold ${data.netTaxLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>₹{Math.abs(data.netTaxLiability || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500">{data.netTaxLiability >= 0 ? 'Payable' : 'Refundable'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
