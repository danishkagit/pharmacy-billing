import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { fileUrl } from '../utils/api';
import { PageHeader } from '../components/ui';

export default function SaleInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/sale-invoices/${id}`).then(res => {
      if (res.success) setInvoice(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pharma-500"></div></div>;
  if (!invoice) return <div className="text-center py-12 text-slate-500">Invoice not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
        <PageHeader title={`Invoice #${invoice.invoiceNo}`} subtitle={`${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')} • ${invoice.paymentStatus}`} />
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn btn-secondary"><i className="fas fa-print mr-1"></i>Print</button>
          <button onClick={() => navigate('/sales')} className="btn btn-secondary"><i className="fas fa-arrow-left mr-1"></i>Back</button>
        </div>
      </div>

      <div className="glass-card p-8 print:p-4 print:shadow-none max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{invoice.companyRef?.name || 'Pharmacy'}</h2>
          <p className="text-sm text-slate-500">GST: {invoice.companyRef?.gstin} | DL: {invoice.companyRef?.dlNo}</p>
          <h3 className="text-lg font-semibold mt-2 text-pharma-700">{invoice.type === 'wholesale' ? 'WHOLESALE INVOICE' : 'RETAIL INVOICE'}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p><span className="text-slate-500">Invoice No:</span> <span className="font-medium text-slate-700">{invoice.invoiceNo}</span></p>
            <p><span className="text-slate-500">Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            <p><span className="text-slate-500">Payment:</span> <span className="capitalize">{invoice.paymentMode}</span></p>
            <p><span className="text-slate-500">Status:</span> <span className={`badge ${invoice.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}`}>{invoice.paymentStatus}</span></p>
          </div>
          <div className="text-right">
            <p className="font-medium text-slate-700">{invoice.customerName || 'Walk-in Customer'}</p>
            {invoice.customerGstin && <p className="text-slate-500">GST: {invoice.customerGstin}</p>}
            {invoice.prescriptionNo && <p className="text-slate-500">Rx: {invoice.prescriptionNo}</p>}
            {invoice.doctorName && <p className="text-slate-500">Dr. {invoice.doctorName}</p>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="bg-white/50 text-slate-500">
            <tr className="border-b border-white/70">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Medicine</th>
              <th className="p-2 text-left">Batch</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Disc%</th>
              <th className="p-2">GST</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {invoice.items?.map((item, i) => (
              <tr key={i}>
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-medium">{item.medicineName}</td>
                <td className="p-2 text-slate-500">{item.batchNo}</td>
                <td className="p-2 text-center">{item.qty}</td>
                <td className="p-2 text-right">{item.rate}</td>
                <td className="p-2 text-center">{item.discountPercent || 0}%</td>
                <td className="p-2 text-center">{item.gstRate || 0}%</td>
                <td className="p-2 text-right font-medium">₹{(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-60 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="text-slate-700">₹{invoice.subtotal?.toFixed(2)}</span></div>
            {invoice.discountAmount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount:</span><span className="text-slate-700">-₹{invoice.discountAmount?.toFixed(2)}</span></div>}
            {invoice.cgst > 0 && <div className="flex justify-between"><span className="text-slate-500">CGST:</span><span className="text-slate-700">₹{invoice.cgst?.toFixed(2)}</span></div>}
            {invoice.sgst > 0 && <div className="flex justify-between"><span className="text-slate-500">SGST:</span><span className="text-slate-700">₹{invoice.sgst?.toFixed(2)}</span></div>}
            {invoice.igst > 0 && <div className="flex justify-between"><span className="text-slate-500">IGST:</span><span className="text-slate-700">₹{invoice.igst?.toFixed(2)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/70 text-slate-800"><span>Total:</span><span>₹{invoice.totalAmount?.toFixed(2)}</span></div>
            {invoice.loyaltyPointsEarned > 0 && <div className="flex justify-between text-pharma-600"><span>Loyalty Points:</span><span>+{invoice.loyaltyPointsEarned}</span></div>}
          </div>
        </div>

        {invoice.isScheduleH1 && <div className="mt-4 p-3 bg-yellow-50/90 rounded-xl text-sm text-yellow-700"><i className="fas fa-exclamation-triangle mr-2"></i>This invoice contains Schedule H1 drugs and has been logged in the compliance register.</div>}
        {invoice.isScheduleX && <div className="mt-4 p-3 bg-red-50/90 rounded-xl text-sm text-red-700"><i className="fas fa-skull mr-2"></i>This invoice contains Schedule X (Narcotic) drugs. Dispensing logged in narcotics register.</div>}

        {invoice.notes && <div className="mt-4 text-sm text-slate-500 italic">Notes: {invoice.notes}</div>}

        {(invoice.prescriptionFile || invoice.billFile) && (
          <div className="mt-6 pt-4 border-t border-white/70">
            <h4 className="text-sm font-semibold text-slate-700 mb-3"><i className="fas fa-paperclip mr-1.5 text-slate-400"></i>Attachments</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {invoice.prescriptionFile && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium">Prescription</p>
                  {invoice.prescriptionFile.match(/\.pdf$/i) ? (
                    <a href={fileUrl(invoice.prescriptionFile)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-pharma-700 hover:underline">
                      <i className="fas fa-file-pdf text-red-500 text-lg"></i>View Prescription PDF
                    </a>
                  ) : (
                    <a href={fileUrl(invoice.prescriptionFile)} target="_blank" rel="noopener noreferrer">
                      <img src={fileUrl(invoice.prescriptionFile)} alt="Prescription" className="h-36 w-36 object-cover rounded-xl border border-white/70 shadow-sm" />
                    </a>
                  )}
                </div>
              )}
              {invoice.billFile && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5 font-medium">Bill File</p>
                  <a href={fileUrl(invoice.billFile)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-pharma-700 hover:underline">
                    <i className="fas fa-file-alt text-slate-500 text-lg"></i>View Bill File
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
