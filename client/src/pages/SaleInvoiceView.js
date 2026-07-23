import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';

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

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500">Invoice not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <h1 className="text-2xl font-bold text-gray-800">Invoice #{invoice.invoiceNo}</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"><i className="fas fa-print mr-2"></i>Print</button>
          <button onClick={() => navigate('/sales')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"><i className="fas fa-arrow-left mr-2"></i>Back</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 print:p-4 print:shadow-none max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{invoice.companyRef?.name || 'Pharmacy'}</h2>
          <p className="text-sm text-gray-500">GST: {invoice.companyRef?.gstin} | DL: {invoice.companyRef?.dlNo}</p>
          <h3 className="text-lg font-semibold mt-2">{invoice.type === 'wholesale' ? 'WHOLESALE INVOICE' : 'RETAIL INVOICE'}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p><span className="text-gray-500">Invoice No:</span> <span className="font-medium">{invoice.invoiceNo}</span></p>
            <p><span className="text-gray-500">Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
            <p><span className="text-gray-500">Payment:</span> <span className="capitalize">{invoice.paymentMode}</span></p>
            <p><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{invoice.paymentStatus}</span></p>
          </div>
          <div className="text-right">
            <p className="font-medium">{invoice.customerName || 'Walk-in Customer'}</p>
            {invoice.customerGstin && <p className="text-gray-500">GST: {invoice.customerGstin}</p>}
            {invoice.prescriptionNo && <p className="text-gray-500">Rx: {invoice.prescriptionNo}</p>}
            {invoice.doctorName && <p className="text-gray-500">Dr. {invoice.doctorName}</p>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="bg-gray-50">
            <tr>
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
          <tbody className="divide-y divide-gray-100">
            {invoice.items?.map((item, i) => (
              <tr key={i}>
                <td className="p-2">{i + 1}</td>
                <td className="p-2 font-medium">{item.medicineName}</td>
                <td className="p-2 text-gray-500">{item.batchNo}</td>
                <td className="p-2 text-center">{item.qty}</td>
                <td className="p-2 text-right">{item.rate}</td>
                <td className="p-2 text-center">{item.discountPercent || 0}%</td>
                <td className="p-2 text-center">{item.gstRate || 0}%</td>
                <td className="p-2 text-right font-medium">₹{(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-60 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>₹{invoice.subtotal?.toFixed(2)}</span></div>
            {invoice.discountAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount:</span><span>-₹{invoice.discountAmount?.toFixed(2)}</span></div>}
            {invoice.cgst > 0 && <div className="flex justify-between"><span className="text-gray-500">CGST:</span><span>₹{invoice.cgst?.toFixed(2)}</span></div>}
            {invoice.sgst > 0 && <div className="flex justify-between"><span className="text-gray-500">SGST:</span><span>₹{invoice.sgst?.toFixed(2)}</span></div>}
            {invoice.igst > 0 && <div className="flex justify-between"><span className="text-gray-500">IGST:</span><span>₹{invoice.igst?.toFixed(2)}</span></div>}
            <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span>₹{invoice.totalAmount?.toFixed(2)}</span></div>
            {invoice.loyaltyPointsEarned > 0 && <div className="flex justify-between text-green-600"><span>Loyalty Points:</span><span>+{invoice.loyaltyPointsEarned}</span></div>}
          </div>
        </div>

        {invoice.isScheduleH1 && <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700"><i className="fas fa-exclamation-triangle mr-2"></i>This invoice contains Schedule H1 drugs and has been logged in the compliance register.</div>}
        {invoice.isScheduleX && <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700"><i className="fas fa-skull mr-2"></i>This invoice contains Schedule X (Narcotic) drugs. Dispensing logged in narcotics register.</div>}

        {invoice.notes && <div className="mt-4 text-sm text-gray-500 italic">Notes: {invoice.notes}</div>}
      </div>
    </div>
  );
}
