import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

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

  const getFilingForInvoice = (invoiceNo) => filingHistory.filter(f => f.referenceNo?.includes(invoiceNo));

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', tdClass: 'font-medium' },
    { label: 'Customer GSTIN', render: inv => inv.gstin, tdClass: 'font-mono text-xs text-slate-500' },
    { label: 'Customer Name', key: 'name' },
    { label: 'Date', render: inv => new Date(inv.date).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Taxable', className: 'text-right', tdClass: 'text-right', render: inv => `₹${inv.taxable?.toFixed(2)}` },
    { label: 'Total', className: 'text-right', tdClass: 'text-right font-medium', render: inv => `₹${inv.total?.toFixed(2)}` },
    {
      label: 'E-Invoice', className: 'text-center', tdClass: 'text-center',
      render: inv => {
        const hasEinvoice = getFilingForInvoice(inv.invoiceNo).some(f => f.type === 'EINVOICE');
        return hasEinvoice
          ? <span className="text-green-600 text-xs"><i className="fas fa-check-circle mr-1"></i>Generated</span>
          : <button onClick={() => generateEInvoice(inv)} disabled={generating === 'einv-' + inv.invoiceNo} className="btn btn-ghost btn-sm text-pharma-600 disabled:opacity-50">{generating === 'einv-' + inv.invoiceNo ? 'Generating...' : 'Generate IRN'}</button>;
      },
    },
    {
      label: 'E-Way Bill', className: 'text-center', tdClass: 'text-center',
      render: inv => {
        const hasEwaybill = getFilingForInvoice(inv.invoiceNo).some(f => f.type === 'EWAYBILL');
        if (hasEwaybill) return <span className="text-green-600 text-xs"><i className="fas fa-check-circle mr-1"></i>Generated</span>;
        if (inv.total >= 50000) return <button onClick={() => generateEwayBill(inv)} disabled={generating === 'eway-' + inv.invoiceNo} className="btn btn-ghost btn-sm text-orange-600 disabled:opacity-50">{generating === 'eway-' + inv.invoiceNo ? 'Generating...' : 'Generate EWB'}</button>;
        return <span className="text-slate-400 text-xs">N/A</span>;
      },
    },
  ];

  const filingColumns = [
    { label: 'Type', render: f => <span className={`badge ${f.type === 'EINVOICE' ? 'badge-purple' : f.type === 'EWAYBILL' ? 'badge-orange' : 'badge-blue'}`}>{f.type}</span> },
    { label: 'Reference No', render: f => f.referenceNo || '-', tdClass: 'font-mono text-xs' },
    { label: 'Period', render: f => `${f.month}/${f.year}` },
    { label: 'Date', render: f => new Date(f.filedDate).toLocaleDateString('en-IN'), tdClass: 'text-slate-500' },
    { label: 'Status', className: 'text-center', tdClass: 'text-center', render: f => <span className={`badge ${f.status === 'filed' ? 'badge-green' : f.status === 'verified' ? 'badge-blue' : 'badge-yellow'}`}>{f.status}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="cloud-upload-alt" title="E-Invoice & E-Way Bill" subtitle="Generate IRN and E-Way Bill for B2B invoices above ₹50,000">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="glass-select w-36">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="glass-select w-28">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </PageHeader>

      {message && (
        <div className={`animate-fade-up px-4 py-3 rounded-xl text-sm flex items-center gap-2 border ${message.type === 'success' ? 'bg-green-50/80 text-green-700 border-green-200' : 'bg-red-50/80 text-red-600 border-red-200'}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>{message.text}
        </div>
      )}

      <GlassCard>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-file-invoice-dollar text-pharma-500"></i>B2B Invoices</h3>
        <GlassTable columns={columns} data={invoices} loading={loading} emptyMessage="No B2B invoices found for this period" />
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><i className="fas fa-history text-pharma-500"></i>Filing History</h3>
        <GlassTable columns={filingColumns} data={filingHistory} loading={false} emptyMessage="No filing history yet" />
      </GlassCard>
    </div>
  );
}