import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

export default function OutstandingReport() {
  const { company } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [overdueData, setOverdueData] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [reminding, setReminding] = useState(null);
  const [reminderMsg, setReminderMsg] = useState(null);

  useEffect(() => {
    API.get('/reports/outstanding', { params: { type: 'receivable' } }).then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadOverdue = () => {
    setOverdueLoading(true);
    API.get('/customers/overdue').then(res => {
      if (res.success) setOverdueData(res.data);
    }).catch(console.error).finally(() => setOverdueLoading(false));
  };

  useEffect(() => {
    if (tab === 'overdue' && !overdueData) loadOverdue();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendWhatsAppReminder = async (row) => {
    if (!row.customerPhone) return setReminderMsg({ type: 'error', text: `${row.customerName} has no phone number saved` });
    setReminding(row.invoiceId);
    setReminderMsg(null);
    try {
      const dueDateStr = new Date(row.dueDate).toLocaleDateString('en-IN');
      const message = `Namaste ${row.customerName}, a gentle payment reminder from ${company?.name || 'your pharmacy'}: Invoice ${row.invoiceNo} of Rs.${row.due.toFixed(2)} was due on ${dueDateStr} and is now ${row.daysOverdue} day(s) overdue. Kindly clear the udhaar at your earliest. Dhanyabad!`;
      const res = await API.post('/sms/send', { recipient: row.customerPhone, message, channel: 'whatsapp', type: 'payment_n' });
      setReminderMsg(res.success
        ? { type: 'success', text: `WhatsApp reminder sent to ${row.customerName}` }
        : { type: 'error', text: res.error || 'Failed to send — check SMS/WhatsApp provider config' });
    } catch (err) {
      setReminderMsg({ type: 'error', text: err?.error || 'Failed to send reminder' });
    } finally {
      setReminding(null);
    }
  };

  const columns = [
    { label: 'Customer', render: r => r.party?.name || r.partyName || '-', tdClass: 'font-medium' },
    { key: 'invoiceNo', label: 'Invoice' },
    { label: 'Date', render: r => new Date(r.date).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Total', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.total?.toFixed(2)}` },
    { label: 'Paid', className: 'text-right', tdClass: 'text-right', render: r => `₹${(r.paid || 0).toFixed(2)}` },
    { label: 'Due', className: 'text-right', tdClass: 'text-right font-bold text-red-600', render: r => `₹${(r.due || 0).toFixed(2)}` },
  ];

  const overdueColumns = [
    { label: 'Customer', render: r => r.customerName || '-', tdClass: 'font-medium' },
    { key: 'invoiceNo', label: 'Invoice' },
    { label: 'Due Date', render: r => new Date(r.dueDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Days Overdue', className: 'text-center', tdClass: 'text-center', render: r => <span className={`badge ${r.daysOverdue > 30 ? 'badge-danger' : 'badge-warning'} text-[10px]`}>{r.daysOverdue}d</span> },
    { label: 'Due', className: 'text-right', tdClass: 'text-right font-bold text-red-600', render: r => `₹${(r.due || 0).toFixed(2)}` },
    {
      label: 'Reminder', className: 'text-center', tdClass: 'text-center',
      render: r => (
        <button
          onClick={() => sendWhatsAppReminder(r)}
          disabled={reminding === r.invoiceId}
          title={r.customerPhone ? `Send WhatsApp reminder to ${r.customerPhone}` : 'No phone number'}
          className="btn btn-ghost btn-sm text-emerald-600 disabled:opacity-50">
          <i className={`fab fa-whatsapp ${reminding === r.invoiceId ? 'fa-spin' : ''} mr-1`}></i>
          {reminding === r.invoiceId ? 'Sending...' : 'Remind'}
        </button>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="hand-holding-usd" title="Outstanding Receivables" subtitle="Due amounts from customers">
        {data && <div className="text-lg font-bold text-red-600"><i className="fas fa-arrow-down mr-1"></i>₹{data.totalReceivable?.toFixed(2)}</div>}
      </PageHeader>

      <div className="flex gap-1 p-1 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 w-fit">
        {[{ k: 'all', l: 'All Receivables', i: 'file-invoice' }, { k: 'overdue', l: 'Overdue Khata', i: 'bell' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${tab === t.k ? 'bg-pharma-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
            <i className={`fas fa-${t.i} text-[10px]`}></i>{t.l}
            {t.k === 'overdue' && overdueData?.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px]">{overdueData.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <GlassCard>
          <GlassTable columns={columns} data={data?.receivable || []} loading={loading} emptyMessage="No outstanding amounts" />
        </GlassCard>
      )}

      {tab === 'overdue' && (
        <>
          {reminderMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 border ${reminderMsg.type === 'success' ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' : 'bg-red-50/90 text-red-600 border-red-200'}`}>
              <i className="fas fa-circle-info"></i>{reminderMsg.text}
            </div>
          )}
          <GlassCard>
            {overdueData && (
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs text-slate-500">Invoices past credit days — send one-tap WhatsApp reminders</p>
                <div className="text-sm font-bold text-red-600"><i className="fas fa-bell mr-1"></i>₹{overdueData.totalOverdue?.toFixed(2)} overdue</div>
              </div>
            )}
            <GlassTable columns={overdueColumns} data={overdueData?.overdue || []} loading={overdueLoading}
              emptyMessage="No overdue khata — all dues within credit days" />
          </GlassCard>
        </>
      )}
    </div>
  );
}
