import { useState, useEffect } from 'react';
import API from '../utils/api';
import { PageHeader, GlassCard, GlassTable } from '../components/ui';

function csvDownload(name, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export default function GSTR1Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('b2b');
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

  const hsnColumns = [
    { label: 'HSN', render: h => h.hsn },
    { label: 'GST Rate', render: h => `${h.gstRate}%` },
    { label: 'Qty', className: 'text-right', tdClass: 'text-right', render: h => h.qty },
    { label: 'Taxable', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.taxableValue?.toFixed(2)}` },
    { label: 'CGST', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.cgst?.toFixed(2)}` },
    { label: 'SGST', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.sgst?.toFixed(2)}` },
    { label: 'IGST', className: 'text-right', tdClass: 'text-right', render: h => `₹${h.igst?.toFixed(2)}` },
  ];

  const exportCsv = () => {
    if (!data) return;
    const rows = [['Section', 'GSTIN/Party', 'Invoice No', 'Date', 'Taxable', 'Tax', 'Total']];
    data.table4_b2b.forEach(i => rows.push(['4A B2B', `${i.gstin} ${i.name || ''}`, i.invoiceNo, new Date(i.date).toLocaleDateString('en-IN'), i.rates.reduce((s, r) => s + r.taxableValue, 0), i.rates.reduce((s, r) => s + r.totalTax, 0), i.value]));
    data.table5_b2cl.forEach(i => rows.push(['5 B2CL', '', i.invoiceNo, new Date(i.date).toLocaleDateString('en-IN'), i.rates.reduce((s, r) => s + r.taxableValue, 0), i.rates.reduce((s, r) => s + r.totalTax, 0), i.value]));
    data.table7_b2cs.rateWise.forEach(r => rows.push(['7 B2CS', `Rate ${r.gstRate}%`, '', '', r.taxableValue, r.totalTax, '']));
    data.table9_cdnr.forEach(c => rows.push(['9B CDNR', c.gstin || c.name, c.creditNoteNo, new Date(c.date).toLocaleDateString('en-IN'), -c.taxable, -c.tax, -c.total]));
    data.table12_hsnSum.forEach(h => rows.push(['12 HSNSUM', h.hsn, `Rate ${h.gstRate}%`, '', h.taxableValue, h.cgst + h.sgst + h.igst, '']));
    csvDownload(`GSTR1-${month}-${year}.csv`, rows);
  };

  const sections = [
    { id: 'b2b', label: `Table 4 · B2B (${data?.summary.b2b ?? 0})` },
    { id: 'b2cl', label: `Table 5 · B2CL (${data?.summary.b2cl ?? 0})` },
    { id: 'b2cs', label: `Table 7 · B2CS` },
    { id: 'cdnr', label: `Table 9B · CDNR (${data?.summary.creditNotes ?? 0})` },
    { id: 'hsn', label: 'Table 12 · HSN Summary' },
    { id: 'exempt', label: 'Table 8 · Nil/Exempt' }
  ];

  return (
    <div className="space-y-5">
      <PageHeader icon="file-invoice-dollar" title="GSTR-1 Report" subtitle="Outward supplies statement — GST 2.0 table structure">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="glass-select w-36">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="glass-select w-28">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportCsv} disabled={!data} className="btn btn-secondary"><i className="fas fa-file-csv mr-1"></i>Export CSV</button>
        </div>
      </PageHeader>
      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger">
              <div className="app-card app-card-hover p-3 text-center"><p className="text-xl font-bold text-slate-700">{data.summary.totalInvoices}</p><p className="text-xs text-slate-500">Invoices</p></div>
              <div className="app-card app-card-hover p-3 text-center"><p className="text-xl font-bold text-blue-600">{data.summary.b2b}</p><p className="text-xs text-slate-500">B2B</p></div>
              <div className="app-card app-card-hover p-3 text-center"><p className="text-xl font-bold text-violet-600">{data.summary.b2cl}</p><p className="text-xs text-slate-500">B2CL &gt; ₹1L</p></div>
              <div className="app-card app-card-hover p-3 text-center"><p className="text-xl font-bold text-green-600">{data.summary.b2cs}</p><p className="text-xs text-slate-500">B2CS</p></div>
              <div className="app-card app-card-hover p-3 text-center"><p className="text-xl font-bold text-red-500">{data.summary.creditNotes}</p><p className="text-xs text-slate-500">Credit Notes</p></div>
              <div className="app-card app-card-hover p-3 text-center"><p className="text-base font-bold text-slate-700 mt-1">₹{data.summary.totalSales?.toFixed(0)}</p><p className="text-xs text-slate-500">Total Sales</p></div>
            </div>

            <div className="glass-tabs inline-flex flex-wrap bg-white/60 border border-gray-200/60 rounded-xl p-1 gap-0.5">
              {sections.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${section === s.id ? 'grad-brand text-white shadow-glow-sm' : 'text-slate-500 hover:bg-white/70'}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {section === 'b2b' && (
              <GlassTable
                columns={[
                  { label: 'GSTIN', render: i => i.gstin, tdClass: 'font-mono text-xs' },
                  { label: 'Party', render: i => i.name || '-' },
                  { label: 'Invoice', render: i => i.invoiceNo },
                  { label: 'Date', render: i => new Date(i.date).toLocaleDateString('en-IN') },
                  { label: 'PoS', render: i => i.placeOfSupply },
                  { label: 'Value', className: 'text-right', tdClass: 'text-right font-semibold', render: i => `₹${i.value?.toFixed(2)}` },
                ]}
                data={data.table4_b2b}
                loading={false}
                emptyMessage="No B2B invoices this period"
              />
            )}

            {section === 'b2cl' && (
              <GlassTable
                columns={[
                  { label: 'Invoice', render: i => i.invoiceNo },
                  { label: 'Date', render: i => new Date(i.date).toLocaleDateString('en-IN') },
                  { label: 'Place of Supply', render: i => i.placeOfSupply || '-' },
                  { label: 'Net Value', className: 'text-right', tdClass: 'text-right font-semibold', render: i => `₹${i.value?.toFixed(2)}` },
                ]}
                data={data.table5_b2cl}
                loading={false}
                emptyMessage="No inter-state B2C invoices above ₹1 lakh"
              />
            )}

            {section === 'b2cs' && (
              <GlassTable
                columns={[
                  { label: 'GST Rate', render: r => `${r.gstRate}%` },
                  { label: 'Qty', className: 'text-right', tdClass: 'text-right', render: r => r.qty },
                  { label: 'Taxable', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.taxableValue.toFixed(2)}` },
                  { label: 'CGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.cgst.toFixed(2)}` },
                  { label: 'SGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.sgst.toFixed(2)}` },
                  { label: 'IGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.igst.toFixed(2)}` },
                ]}
                data={data.table7_b2cs.rateWise}
                loading={false}
                emptyMessage="No B2C supplies"
              />
            )}

            {section === 'cdnr' && (
              <GlassTable
                columns={[
                  { label: 'Credit Note No', render: c => c.creditNoteNo },
                  { label: 'Original Invoice', render: c => c.originalInvoiceNo || '-' },
                  { label: 'Buyer', render: c => c.name || c.gstin || '-' },
                  { label: 'Reason', render: c => String(c.reason || '').replace(/_/g, ' ') },
                  { label: 'Date', render: c => new Date(c.date).toLocaleDateString('en-IN') },
                  { label: 'Taxable', className: 'text-right', tdClass: 'text-right', render: c => `-₹${c.taxable?.toFixed(2)}` },
                  { label: 'Tax', className: 'text-right', tdClass: 'text-right', render: c => `-₹${c.tax?.toFixed(2)}` },
                ]}
                data={data.table9_cdnr}
                loading={false}
                emptyMessage="No credit notes issued"
              />
            )}

            {section === 'hsn' && <GlassTable columns={hsnColumns} data={data.table12_hsnSum} loading={false} emptyMessage="No HSN data" />}

            {section === 'exempt' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                <div className="app-card p-4 text-center"><p className="text-2xl font-bold text-emerald-600">₹{data.summary.exemptTaxable?.toFixed(2)}</p><p className="text-sm text-slate-500">Nil-rated / Exempt Value (incl. life-saving drugs)</p></div>
                <div className="app-card p-4 text-center"><p className="text-2xl font-bold text-slate-700">{data.summary.exemptQty}</p><p className="text-sm text-slate-500">Exempt Quantity</p></div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
