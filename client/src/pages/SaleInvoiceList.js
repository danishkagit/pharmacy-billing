import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function SaleInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (type) params.type = type;
    API.get('/sale-invoices', { params }).then(res => {
      if (res.success) setInvoices(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [from, to, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Invoices</h1>
        <Link to="/sales/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <i className="fas fa-plus"></i> New Sale
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex gap-4 mb-4">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Invoice No</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-center p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Payment Mode</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-center p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{inv.invoiceNo}</td>
                    <td className="p-3">{inv.customerName || inv.customer?.name || 'Walk-in'}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${inv.type === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{inv.type}</span></td>
                    <td className="p-3 text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-right font-medium">₹{inv.totalAmount?.toFixed(2)}</td>
                    <td className="p-3 text-center capitalize">{inv.paymentMode}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : inv.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{inv.paymentStatus}</span>
                    </td>
                    <td className="p-3 text-center">
                      <Link to={`/sales/${inv._id}`} className="text-blue-600 hover:underline text-xs mr-2">View</Link>
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
