import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

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
    <div className="space-y-5">
      <PageHeader icon="gift" title="Loyalty Management" subtitle="Track points, rewards, and redemption" />

      <GlassCard>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Select Customer</label>
        <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="glass-select">
          <option value="">-- Choose Customer --</option>
          {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone || 'N/A'})</option>)}
        </select>
      </GlassCard>

      {error && <div className="animate-fade-up bg-red-50/90 text-red-600 px-4 py-2 rounded-xl text-sm mb-4 flex items-center gap-2 border border-red-200"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      {loading && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pharma-500"></div></div>}

      {!loading && customerId && loyaltyData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="glass-card surface-glass p-5 text-center stagger">
              <p className="text-sm text-slate-500 mb-1">Points Balance</p>
              <p className="text-4xl font-bold text-pharma-600">{points}</p>
            </div>
            <div className="glass-card surface-glass p-5 text-center stagger">
              <p className="text-sm text-slate-500 mb-1">Total Earned</p>
              <p className="text-4xl font-bold text-emerald-600">{loyaltyData.totalPointsEarned || 0}</p>
            </div>
            <div className="glass-card surface-glass p-5 text-center stagger">
              <p className="text-sm text-slate-500 mb-1">Total Redeemed</p>
              <p className="text-4xl font-bold text-red-600">{loyaltyData.totalPointsRedeemed || 0}</p>
            </div>
          </div>

          {points > 0 && (
            <GlassCard>
              <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2"><i className="fas fa-gift text-pharma-500"></i>Redeem Points</h2>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Points to Redeem</label>
                  <input type="number" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} max={points} className="glass-input" placeholder={`Max ${points}`} />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Sale Invoice (optional)</label>
                  <input type="text" value={saleInvoiceId} onChange={e => setSaleInvoiceId(e.target.value)} className="glass-input" placeholder="Invoice ID" />
                </div>
                <button onClick={handleRedeem} disabled={redeeming || !redeemPoints || parseInt(redeemPoints) <= 0} className="btn btn-primary btn-glow disabled:opacity-50">{redeeming ? 'Redeeming...' : 'Redeem'}</button>
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2"><i className="fas fa-history text-pharma-500"></i>Transaction History</h2>
            <GlassTable
              columns={[
                { label: 'Date', className: 'text-slate-500', render: t => new Date(t.date || t.createdAt).toLocaleDateString('en-IN') },
                { label: 'Type', render: t => <span className={`badge ${t.type === 'earned' ? 'badge-green' : t.type === 'redeemed' ? 'badge-red' : t.type === 'expired' ? 'badge-gray' : 'badge-yellow'} capitalize`}>{t.type}</span> },
                { label: 'Points', className: 'text-right', tdClass: 'text-right', render: t => <span className={`font-medium ${(t.points || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.points > 0 ? '+' : ''}{t.points}</span> },
                { label: 'Reference', className: 'text-slate-500', render: t => t.reference || t.saleInvoiceId || '-' },
                { label: 'Status', className: 'text-center', tdClass: 'text-center', render: t => <span className={`badge ${t.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{t.status || 'completed'}</span> },
              ]}
              data={transactions}
              loading={false}
              emptyMessage="No transactions yet"
            />
          </GlassCard>
        </>
      )}

      {!loading && customerId && !loyaltyData && !error && (
        <div className="text-center py-12 text-slate-400"><i className="fas fa-gift text-4xl mb-3"></i><div className="surface-1 rounded-xl p-6 max-w-sm mx-auto"><p className="font-medium text-slate-600">No loyalty data found for this customer</p></div></div>
      )}
    </div>
  );
}
