import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';

export default function ExpiryDashboard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(60);

  useEffect(() => {
    API.get('/batches/expiry-report', { params: { days } }).then(res => {
      if (res.success) setBatches(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [days]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expiry Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{batches.length} batch(es) expiring within {days} days</p>
        </div>
        <div className="flex gap-2">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-4 py-2 rounded-lg text-sm font-medium ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{d} days</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
            <p className="text-gray-500">No items expiring within {days} days</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-3 font-medium">Medicine</th>
                  <th className="text-left p-3 font-medium">Manufacturer</th>
                  <th className="text-left p-3 font-medium">Batch</th>
                  <th className="text-center p-3 font-medium">Qty</th>
                  <th className="text-center p-3 font-medium">MRP</th>
                  <th className="text-center p-3 font-medium">Expiry</th>
                  <th className="text-center p-3 font-medium">Days Left</th>
                  <th className="text-left p-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((b, i) => (
                  <tr key={i} className={b.daysRemaining <= 30 ? 'bg-red-50' : b.daysRemaining <= 60 ? 'bg-orange-50' : 'bg-yellow-50'}>
                    <td className="p-3 font-medium">{b.medicineName}</td>
                    <td className="p-3 text-gray-500">{b.manufacturer || '-'}</td>
                    <td className="p-3 text-gray-500">{b.batchNo}</td>
                    <td className="p-3 text-center">{b.qty}</td>
                    <td className="p-3 text-center">₹{b.mrp}</td>
                    <td className="p-3 text-center">{new Date(b.expiryDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${b.daysRemaining <= 30 ? 'text-red-600' : b.daysRemaining <= 60 ? 'text-orange-600' : 'text-yellow-600'}`}>{b.daysRemaining}</span>
                    </td>
                    <td className="p-3 text-gray-500">{b.location || '-'}</td>
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
