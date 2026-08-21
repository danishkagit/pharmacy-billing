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
    <div className="space-y-5">
      <PageHeader icon="file-contract" title="GSTR-3B Report" subtitle="Monthly summary return — output tax & ITC">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="glass-select w-36">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="glass-select w-28">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => data && csvDownload(`GSTR3B-${month}-${year}.csv`, [
            ['Section', 'GST Rate', 'Taxable Value', 'CGST', 'SGST', 'IGST'],
            ...data.table3_1a.slabwise.map(r => ['3.1(a)', `${r.gstRate}%`, r.taxableValue, r.cgst, r.sgst, r.igst]),
            ['4(A)(5) ITC', '', data.table4_itc.taxableValue, '', '', data.table4_itc.totalTax],
            ['Net Liability', '', '', '', '', data.netTaxLiability]
          ])} disabled={!data} className="btn btn-secondary"><i className="fas fa-file-csv mr-1"></i>Export CSV</button>
        </div>
      </PageHeader>
      <GlassCard>
        {loading ? (
          <div className="flex justify-center py-14"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-pharma-500"></div></div>
        ) : data && (
          <div className="space-y-6">
            {/* Table 3.1(a) */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2"><i className="fas fa-arrow-up-right-dots mr-1.5 text-pharma-500"></i>Table 3.1(a) — Outward Taxable Supplies</h3>
              <GlassTable
                columns={[
                  { label: 'GST Rate', render: r => (r.gstRate || 0) === 0 ? 'NIL/Exempt' : `${r.gstRate}%` },
                  { label: 'Qty', className: 'text-right', tdClass: 'text-right', render: r => r.qty },
                  { label: 'Taxable Value', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.taxableValue.toFixed(2)}` },
                  { label: 'CGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.cgst.toFixed(2)}` },
                  { label: 'SGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.sgst.toFixed(2)}` },
                  { label: 'IGST', className: 'text-right', tdClass: 'text-right', render: r => `₹${r.igst.toFixed(2)}` },
                ]}
                data={data.table3_1a.slabwise}
                loading={false}
                emptyMessage="No outward supplies this period"
              />
              <div className="mt-2 flex justify-end gap-6 text-sm font-semibold text-slate-700 pr-1">
                <span>Total Taxable: ₹{data.table3_1a.taxableValue?.toFixed(2)}</span>
                <span>Output Tax: ₹{data.table3_1a.tax?.total?.toFixed(2)}</span>
                <span className="text-xs font-normal text-slate-400 self-center">(CGST ₹{data.table3_1a.tax?.cgst} · SGST ₹{data.table3_1a.tax?.sgst} · IGST ₹{data.table3_1a.tax?.igst})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table 4 ITC */}
              <div className="app-card p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-2"><i className="fas fa-arrow-down-short-wide mr-1.5 text-blue-500"></i>Table 4 — Input Tax Credit</h3>
                <p className="text-2xl font-bold text-blue-600">₹{data.table4_itc.totalTax?.toFixed(2)}</p>
                <p className="text-xs text-slate-400">on taxable purchases of ₹{data.table4_itc.taxableValue?.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-snug">{data.table4_itc.note}</p>
              </div>
              {/* Net liability */}
              <div className={`relative overflow-hidden p-4 rounded-2xl border ${data.netTaxLiability >= 0 ? 'bg-red-50/70 border-red-200' : 'bg-green-50/70 border-green-200'}`}>
                <p className="text-sm text-slate-500 font-medium">Net Tax Liability (Output − ITC)</p>
                <p className={`text-3xl font-bold ${data.netTaxLiability >= 0 ? 'text-red-600' : 'text-green-600'}`}>₹{Math.abs(data.netTaxLiability || 0).toFixed(2)}</p>
                <span className={`badge mt-2 ${data.netTaxLiability >= 0 ? 'badge-red' : 'badge-green'}`}>{data.netTaxLiability >= 0 ? 'Payable in Cash' : 'Credit Carry-forward'}</span>
              </div>
            </div>

            {/* Compliance notes */}
            <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-bold text-sky-800 uppercase tracking-wide mb-1"><i className="fas fa-circle-info mr-1"></i>Compliance Notes</p>
              {(data.complianceNotes || []).map((n, i) => <p key={i} className="text-xs text-sky-700">{n}</p>)}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
