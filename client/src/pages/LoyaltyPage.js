import { useState, useEffect } from 'react';
import API from '../utils/api';

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [saleInvoiceId, setSaleInvoiceId] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/customers', { params: { limit: 500 } }).then(res => {
      if (res.success) setCustomers(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!customerId) { setLoyaltyData(null); setTransactions([]); return; }
    setLoading(true);
    setError('');
    API.get(`/loyalty/${customerId}`).then(res => {
      if (res.success) {
        setLoyaltyData(res.data.customer);
        setTransactions(res.data.transactions || []);
      }
    }).catch(err => setError(err?.error || 'Failed to load loyalty data')).finally(() => setLoading(false));
  }, [customerId]);

  const handleRedeem = async () => {
    const points = parseInt(redeemPoints);
    if (!points || points <= 0) return;
    setRedeeming(true);
    setError('');
    try {
      const res = await API.post('/loyalty/redeem', { customerId, points: parseInt(redeemPoints), saleInvoiceId: saleInvoiceId || undefined });
      if (res.success) {
        setLoyaltyData(res.data);
        setTransactions(prev => [{ date: new Date().toISOString(), type: 'redeemed', points: -parseInt(redeemPoints), reference: saleInvoiceId || 'Manual', status: 'completed' }, ...prev]);
        setRedeemPoints('');
        setSaleInvoiceId('');
      }
    } catch (err) {
      setError(err?.error || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const c = customers.find(c => c._id === customerId);
  const points = loyaltyData?.loyaltyPoints || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Loyalty Management</h1>
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none">
          <option value="">-- Choose Customer --</option>
          {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone || 'N/A'})</option>)}
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}

      {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}

      {!loading && customerId && loyaltyData && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Points Balance</p>
              <p className="text-4xl font-bold text-blue-600">{points}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Earned</p>
              <p className="text-4xl font-bold text-green-600">{loyaltyData.totalPointsEarned || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Redeemed</p>
              <p className="text-4xl font-bold text-red-600">{loyaltyData.totalPointsRedeemed || 0}</p>
            </div>
          </div>

          {points > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Redeem Points</h2>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points to Redeem</label>
                  <input type="number" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} max={points} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder={`Max ${points}`} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Invoice (optional)</label>
                  <input type="text" value={saleInvoiceId} onChange={e => setSaleInvoiceId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Invoice ID" />
                </div>
                <button onClick={handleRedeem} disabled={redeeming || !redeemPoints || parseInt(redeemPoints) <= 0} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{redeeming ? 'Redeeming...' : 'Redeem'}</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Transaction History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-right p-3 font-medium">Points</th>
                    <th className="text-left p-3 font-medium">Reference</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No transactions yet</td></tr>
                  ) : transactions.map((t, i) => (
                    <tr key={t._id || i} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-500">{new Date(t.date || t.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${t.type === 'earned' ? 'bg-green-100 text-green-700' : t.type === 'redeemed' ? 'bg-red-100 text-red-700' : t.type === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.type}</span></td>
                      <td className={`p-3 text-right font-medium ${(t.points || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</td>
                      <td className="p-3 text-gray-500">{t.reference || t.saleInvoiceId || '-'}</td>
                      <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status || 'completed'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && customerId && !loyaltyData && !error && (
        <div className="text-center py-12 text-gray-400"><i className="fas fa-gift text-4xl mb-3"></i><p>No loyalty data found for this customer</p></div>
      )}
    </div>
  );
}
