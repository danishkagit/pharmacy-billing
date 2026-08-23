import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { fileUrl } from '../utils/api';
import { PageHeader, GlassModal } from '../components/ui';
import { BrandWordmark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { amountInWords, inclusiveBreakup } from '../utils/gst';

const TEMPLATES = [
  { value: 'a4', label: 'A4 Tax Invoice', icon: 'file' },
  { value: 'a5', label: 'A5 Invoice', icon: 'file-alt' },
  { value: 'thermal80', label: 'Thermal 80mm', icon: 'receipt' },
  { value: 'thermal58', label: 'Thermal 58mm', icon: 'receipt-long' }
];

export default function SaleInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [upiPayload, setUpiPayload] = useState(null);
  const [upiLoading, setUpiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [template, setTemplate] = useState('a4');

  useEffect(() => {
    API.get(`/sale-invoices/${id}`).then(res => {
      if (res.success) {
        setInvoice(res.data);
        const co = res.data.companyRef || {};
        setTemplate(co.invoiceTemplate || 'a4');
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const store = invoice?.companyRef?.name || company?.name || 'Pharmacy';
  const co = invoice?.companyRef || {};
  const upiId = co.upiId || company?.upiId;
  const isComposition = co.gstType === 'composition';

  // Auto-generate the UPI QR once so it embeds inside the printed invoice.
  useEffect(() => {
    if (!invoice || !upiId || upiPayload) return;
    API.post('/barcode/upi-qr', {
      upiId,
      merchantName: store,
      amount: invoice.totalAmount || 0,
      note: `Invoice ${invoice.invoiceNo}`
    }).then(res => { if (res.success) setUpiPayload(res.data); }).catch(() => {});
  }, [invoice, upiId, store]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pharma-500"></div></div>;
  if (!invoice) return <div className="text-center py-12 text-slate-500">Invoice not found</div>;

  const waPhone = (p) => {
    let d = String(p || '').replace(/[^\d]/g, '');
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length === 10) d = '91' + d;
    return d;
  };

  const genUPI = async () => {
    if (!upiId) return;
    setUpiLoading(true);
    try {
      if (upiPayload) { setShowQr(true); return; }
      const res = await API.post('/barcode/upi-qr', {
        upiId,
        merchantName: store,
        amount: invoice.totalAmount || 0,
        note: `Invoice ${invoice.invoiceNo}`
      });
      if (res.success) { setUpiPayload(res.data); setShowQr(true); }
    } catch (err) { alert(err?.error || 'Could not generate UPI QR'); }
    finally { setUpiLoading(false); }
  };

  const shareWhatsApp = () => {
    const phone = waPhone(invoice.customerPhone);
    if (!phone) return alert('No customer phone on this invoice');
    let msg = `*Invoice ${invoice.invoiceNo}* from ${store}\nAmount: ₹${(invoice.totalAmount || 0).toFixed(2)}\nPayment: ${invoice.paymentMode}\nStatus: ${invoice.paymentStatus}\n\nThank you for your purchase!`;
    if (upiId) {
      const note = encodeURIComponent(`Invoice ${invoice.invoiceNo}`);
      msg += `\n\nPay online: upi://pay?pa=${upiId}&am=${invoice.totalAmount || 0}&cu=INR&tn=${note}`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  // ---------- Derived print data ----------
  const interState = (invoice.igst || 0) > 0;
  const isThermal = template === 'thermal80' || template === 'thermal58';
  const showHsn = (co.showHsnOnPrint !== false) && !isThermal;
  const showExp = co.showExpiryOnPrint !== false;
  const showMrp = co.showMrpOnPrint !== false && !isThermal;

  const itemDiscountTotal = (invoice.items || []).reduce((s, i) => s + (i.discount || 0), 0);

  const rateRows = [];
  const hsnMap = {};
  (invoice.items || []).forEach(it => {
    const rate = it.gstRate || 0;
    const taxable = it.taxableValue != null ? it.taxableValue
      : (it.amount - (it.gstAmount || 0));
    const key = `${it.hsn || '3004'}-${rate}`;
    if (!hsnMap[key]) hsnMap[key] = { hsn: it.hsn || '3004', gstRate: rate, taxableValue: 0, totalTax: 0 };
    hsnMap[key].taxableValue += taxable;
    hsnMap[key].totalTax += it.gstAmount || 0;
    if (!rateRows.find(r => r.gstRate === rate)) rateRows.push({ gstRate: rate, taxableValue: 0, totalTax: 0 });
    const rr = rateRows.find(r => r.gstRate === rate);
    rr.taxableValue += taxable;
    rr.totalTax += it.gstAmount || 0;
  });

  const expFmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : '-';
  const money = (v) => `₹${(Number(v) || 0).toFixed(2)}`;
  const copies = Math.max(1, Math.min(3, co.billCopies || 1));

  const declarations = [];
  if (isComposition) declarations.push('Composition taxable person — not entitled to collect tax on supplies.');
  if (invoice.isScheduleH1) declarations.push(co.scheduleWarningNote || 'Schedule H/H1 drugs to be sold only against the prescription of a Registered Medical Practitioner.');
  if (invoice.isScheduleX) declarations.push('Contains Schedule X drug — entry recorded in narcotics register.');
  if (co.declarationNote) declarations.push(co.declarationNote);
  else declarations.push('Goods once sold will not be taken back or exchanged.');

  // ================= THERMAL RECEIPT TEMPLATE =================
  const renderThermal = () => (
    <div className={`inv-receipt mx-auto bg-white text-black p-3 font-mono ${template === 'thermal58' ? 'max-w-[240px] text-[10px]' : 'max-w-[320px] text-[11px]'}`}>
      <div className="text-center leading-tight">
        <p className="font-bold uppercase tracking-wide">{co.name || store}</p>
        {co.address && <p>{[co.address, co.city].filter(Boolean).join(', ')}</p>}
        {co.phone && <p>Ph: {co.phone}</p>}
        <p>GSTIN: {co.gstin || '-'}</p>
        {(co.dlNo || co.dlNoWholesale) && <p>DL: {[co.dlNo, co.dlNoWholesale].filter(Boolean).join(' / ')}</p>}
      </div>
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="flex justify-between">
        <span>Bill: {invoice.invoiceNo}</span>
        <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
      </div>
      <div className="flex justify-between">
        <span>Cashier</span>
        <span>{invoice.createdBy?.name || '-'}</span>
      </div>
      {(invoice.customerName || invoice.customerPhone) && (
        <div className="flex justify-between"><span>Cust:</span><span>{invoice.customerName || ''}{invoice.customerPhone ? ` ${invoice.customerPhone}` : ''}</span></div>
      )}
      {invoice.doctorName && <div>Dr: {invoice.doctorName} {invoice.prescriptionNo ? `(Rx: ${invoice.prescriptionNo})` : ''}</div>}
      {invoice.customerGstin && <div>Buyer GSTIN: {invoice.customerGstin}</div>}
      <div className="border-t border-dashed border-black my-2"></div>
      {(invoice.items || []).map((item, i) => {
        const b = inclusiveBreakup(item.amount, item.gstRate, interState);
        return (
          <div key={i} className="mb-1.5 leading-tight">
            <div className="font-bold">{item.medicineName}{item.schedule === 'H1' ? ' [H1]' : item.schedule === 'X' ? ' [X]' : ''}</div>
            <div className="flex justify-between text-[9px]">
              <span>B:{item.batchNo || '-'}{showExp ? ` E:${expFmt(item.expiryDate)}` : ''}</span>
              <span>GST {item.gstRate || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>{item.qty} × {money(item.rate)}{(item.discountPercent > 0) ? ` (-${item.discountPercent}%)` : ''}</span>
              <span>{(item.amount || 0).toFixed(2)}</span>
            </div>
          </div>
        );
      })}
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="space-y-0.5">
        <div className="flex justify-between"><span>Taxable Value</span><span>{(invoice.subtotal - invoice.taxAmount).toFixed(2)}</span></div>
        {!isComposition && <>
          {interState
            ? <div className="flex justify-between"><span>IGST</span><span>{(invoice.igst || invoice.taxAmount).toFixed(2)}</span></div>
            : <>
              <div className="flex justify-between"><span>CGST</span><span>{(invoice.cgst ?? (invoice.taxAmount / 2)).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST</span><span>{(invoice.sgst ?? (invoice.taxAmount / 2)).toFixed(2)}</span></div>
            </>}
        </>}
        {roundOffRow(invoice)}
      </div>
      <div className="border-t-2 border-black my-2"></div>
      <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>Rs. {(invoice.totalAmount || 0).toFixed(2)}</span></div>
      <div className="flex justify-between"><span>Paid ({String(invoice.paymentMode).toUpperCase()})</span><span>{(invoice.paidAmount || invoice.totalAmount || 0).toFixed(2)}</span></div>
      {invoice.changeAmount > 0 && <div className="flex justify-between"><span>Change</span><span>{invoice.changeAmount.toFixed(2)}</span></div>}
      <div className="border-t border-dashed border-black my-2"></div>
      <p className="leading-tight">{amountInWords(invoice.totalAmount)}</p>
      {upiPayload && (
        <div className="text-center my-2">
          <img src={upiPayload.qr} alt="UPI QR" className="mx-auto w-28 h-28" />
          <p className="text-[9px]">Scan to pay via UPI{upiId ? ` · ${upiId}` : ''}</p>
        </div>
      )}
      <div className="border-t border-dashed border-black my-2"></div>
      {declarations.map((d, i) => <p key={i} className="text-[9px] leading-tight">* {d}</p>)}
      <p className="text-center mt-2 font-bold">{co.invoiceNote || 'Thank You! Visit Again'}</p>
      {/* Registered Pharmacist — signature prints on every bill */}
      {(co.pharmacistName || company?.pharmacistName || co.pharmacistSignature || company?.pharmacistSignature) && (
        <div className="mt-3 pt-3 border-t border-black flex justify-between items-end gap-4">
          <div className="text-[9px] text-slate-500 self-end">Customer Signature</div>
          <div className="text-center">
            {(co.pharmacistSignature || company?.pharmacistSignature) && (
              <img src={co.pharmacistSignature || company?.pharmacistSignature} alt="Registered pharmacist signature" className="h-10 w-auto max-w-[140px] object-contain mx-auto mb-1 bg-white" />
            )}
            <p className="text-[10px] font-bold">Registered Pharmacist</p>
            {(co.pharmacistName || company?.pharmacistName) && <p className="text-[9px] font-semibold">{co.pharmacistName || company?.pharmacistName}</p>}
            {(co.pharmacistRegNo || company?.pharmacistRegNo) && <p className="text-[8px] font-mono">Reg No: {co.pharmacistRegNo || company?.pharmacistRegNo}</p>}
          </div>
        </div>
      )}
      <p className="text-center text-[9px] mt-3">Powered by <BrandWordmark className="text-[10px] align-middle" /></p>
    </div>
  );

  const roundOffRow = (inv) => {
    if (!inv.roundOff) return null;
    return <div className="flex justify-between"><span>Round Off</span><span>{inv.roundOff > 0 ? '+' : ''}{inv.roundOff.toFixed(2)}</span></div>;
  };

  // ================= FULL TAX INVOICE TEMPLATE (A4 / A5) =================
  const renderTaxInvoice = () => (
    <div className={`inv-sheet mx-auto bg-white text-slate-900 shadow-sm border border-slate-200 ${template === 'a5' ? 'max-w-[640px] p-6' : 'max-w-4xl p-8'} print:border-0 print:shadow-none`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-3">
        <div className="min-w-0">
          <h2 className={`${template === 'a5' ? 'text-lg' : 'text-2xl'} font-bold tracking-tight text-slate-900`}>{co.name || store}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{[co.address, co.city, co.state, co.pincode].filter(Boolean).join(', ')}</p>
          <p className="text-xs text-slate-500">{[co.phone && `Ph: ${co.phone}`, co.email].filter(Boolean).join(' | ')}</p>
        </div>
        <div className="text-right shrink-0">
          <h3 className={`inline-block px-3 py-1 border-2 border-slate-800 rounded font-bold tracking-widest ${template === 'a5' ? 'text-xs' : 'text-sm'}`}>
            {isComposition ? 'BILL OF SUPPLY' : 'TAX INVOICE'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Retail Sale{copies > 1 ? ` • Copy 1 of ${copies}` : ''}</p>
        </div>
      </div>

      {/* Registration strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 py-2.5 text-[11px] border-b border-slate-200 bg-slate-50/70 px-3 rounded-b">
        <span><span className="text-slate-400">GSTIN:</span> <span className="font-semibold font-mono">{co.gstin || '-'}</span></span>
        <span><span className="text-slate-400">PAN:</span> <span className="font-semibold">{co.pan || '-'}</span></span>
        <span><span className="text-slate-400">DL No:</span> <span className="font-semibold">{[co.dlNo, co.dlNoWholesale].filter(Boolean).join(' / ') || '-'}</span></span>
        <span><span className="text-slate-400">State:</span> <span className="font-semibold">{co.state || '-'} ({String(co.gstin || '').slice(0, 2) || '-'})</span></span>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 pb-3 border-b border-slate-200">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To</p>
          <p className="font-bold text-sm">{invoice.customerName || 'Walk-in Customer'}</p>
          {invoice.customerPhone && <p className="text-xs text-slate-500">Ph: {invoice.customerPhone}</p>}
          {invoice.customerGstin && <p className="text-xs font-mono">GSTIN: {invoice.customerGstin}</p>}
          {(invoice.billingAddress) && <p className="text-xs text-slate-500">{invoice.billingAddress}</p>}
        </div>
        <div className="md:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Invoice Details</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs md:inline-block md:text-right md:space-y-0.5">
            <p><span className="text-slate-400">Invoice No:</span> <span className="font-bold">{invoice.invoiceNo}</span></p>
            <p><span className="text-slate-400">Date:</span> <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span></p>
            <p><span className="text-slate-400">Place of Supply:</span> <span className="font-semibold">{invoice.placeOfSupply || String(invoice.customerGstin || '').slice(0, 2) || co.state || '-'}</span></p>
            <p><span className="text-slate-400">Payment:</span> <span className="capitalize font-semibold">{invoice.paymentMode}</span></p>
            {invoice.prescriptionNo && <p><span className="text-slate-400">Rx No:</span> <span className="font-semibold">{invoice.prescriptionNo}</span></p>}
            {invoice.doctorName && <p><span className="text-slate-400">Doctor:</span> <span className="font-semibold">Dr. {invoice.doctorName}</span></p>}
            {invoice.patientName && <p><span className="text-slate-400">Patient:</span> <span className="font-semibold">{invoice.patientName}</span></p>}
          </div>
        </div>
      </div>

      {/* Items */}
      <table className={`w-full mt-3 text-[11px] ${template === 'a5' ? 'text-[10px]' : ''}`}>
        <thead>
          <tr className="bg-slate-100 text-slate-600 uppercase text-[9px] tracking-wide">
            <th className="px-1.5 py-2 text-left w-8">#</th>
            <th className="px-1.5 py-2 text-left">Medicine</th>
            {showHsn && <th className="px-1.5 py-2 text-left w-14">HSN</th>}
            <th className="px-1.5 py-2 text-left w-20">Batch</th>
            {showExp && <th className="px-1.5 py-2 text-left w-14">Exp</th>}
            <th className="px-1.5 py-2 text-right w-8">Qty</th>
            {showMrp && <th className="px-1.5 py-2 text-right w-12">MRP</th>}
            <th className="px-1.5 py-2 text-right w-14">Rate</th>
            <th className="px-1.5 py-2 text-right w-10">Disc%</th>
            <th className="px-1.5 py-2 text-right w-16">Taxable</th>
            <th className="px-1.5 py-2 text-right w-10">GST%</th>
            {!interState ? <>
              <th className="px-1.5 py-2 text-right w-14">CGST</th>
              <th className="px-1.5 py-2 text-right w-14">SGST</th>
            </> : <th className="px-1.5 py-2 text-right w-14">IGST</th>}
            <th className="px-1.5 py-2 text-right w-16">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, i) => {
            const b = inclusiveBreakup(item.amount, item.gstRate, interState);
            return (
              <tr key={i} className="align-top">
                <td className="px-1.5 py-1.5 text-slate-400">{i + 1}</td>
                <td className="px-1.5 py-1.5 font-medium">
                  {item.medicineName}
                  {item.schedule === 'H1' && <span className="ml-1 text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-bold">H1</span>}
                  {item.schedule === 'X' && <span className="ml-1 text-[8px] bg-red-100 text-red-700 px-1 rounded font-bold">X</span>}
                </td>
                {showHsn && <td className="px-1.5 py-1.5 font-mono text-slate-500">{item.hsn || '3004'}</td>}
                <td className="px-1.5 py-1.5 text-slate-500">{item.batchNo}</td>
                {showExp && <td className="px-1.5 py-1.5 text-slate-500">{expFmt(item.expiryDate)}</td>}
                <td className="px-1.5 py-1.5 text-right">{item.qty}</td>
                {showMrp && <td className="px-1.5 py-1.5 text-right text-slate-400">{(item.mrp ?? 0).toFixed(2)}</td>}
                <td className="px-1.5 py-1.5 text-right">{(item.rate ?? 0).toFixed(2)}</td>
                <td className="px-1.5 py-1.5 text-right">{item.discountPercent || 0}%</td>
                <td className="px-1.5 py-1.5 text-right">{b.taxable.toFixed(2)}</td>
                <td className="px-1.5 py-1.5 text-right">{item.gstRate ? `${item.gstRate}%` : 'NIL'}</td>
                {!interState ? <>
                  <td className="px-1.5 py-1.5 text-right text-slate-500">{b.cgst.toFixed(2)}</td>
                  <td className="px-1.5 py-1.5 text-right text-slate-500">{b.sgst.toFixed(2)}</td>
                </> : <td className="px-1.5 py-1.5 text-right text-slate-500">{b.igst.toFixed(2)}</td>}
                <td className="px-1.5 py-1.5 text-right font-semibold">{(item.amount || 0).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals + tax summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          {!isComposition && Object.keys(hsnMap).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">HSN / Rate-wise Tax Summary</p>
              <table className="w-full text-[10px] border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-2 py-1 text-left">HSN</th>
                    <th className="px-2 py-1 text-right">Taxable</th>
                    <th className="px-2 py-1 text-right">Rate</th>
                    <th className="px-2 py-1 text-right">{interState ? 'IGST' : 'CGST+SGST'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(hsnMap).map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 font-mono">{r.hsn}</td>
                      <td className="px-2 py-1 text-right">{r.taxableValue.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right">{r.gstRate}%</td>
                      <td className="px-2 py-1 text-right">{r.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {invoice.notes && <p className="text-xs text-slate-500 italic mt-3">Notes: {invoice.notes}</p>}
          {invoice.loyaltyPointsEarned > 0 && <p className="text-xs text-pharma-600 font-medium mt-2">Loyalty Points Earned: +{invoice.loyaltyPointsEarned}</p>}
        </div>

        <div className="justify-self-end w-full max-w-xs">
          <div className="text-xs space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal (MRP):</span><span>{money(invoice.subtotal)}</span></div>
            {itemDiscountTotal > 0 && <div className="flex justify-between"><span className="text-slate-500">Item Discount:</span><span>-{money(itemDiscountTotal)}</span></div>}
            {invoice.customerDiscount > 0 && <div className="flex justify-between text-emerald-700"><span>Customer Discount ({invoice.customerDiscountPercent}%):</span><span>-{money(invoice.customerDiscount)}</span></div>}
            {!isComposition && <div className="flex justify-between"><span className="text-slate-500">Taxable Value:</span><span>{money((invoice.subtotal || 0) - (invoice.taxAmount || 0))}</span></div>}
            {!isComposition && <>
              {(invoice.cgst ?? (interState ? 0 : invoice.taxAmount / 2)) > 0 && <div className="flex justify-between"><span className="text-slate-500">CGST:</span><span>{money(invoice.cgst ?? invoice.taxAmount / 2)}</span></div>}
              {(invoice.sgst ?? (interState ? 0 : invoice.taxAmount / 2)) > 0 && <div className="flex justify-between"><span className="text-slate-500">SGST:</span><span>{money(invoice.sgst ?? invoice.taxAmount / 2)}</span></div>}
              {(invoice.igst || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">IGST:</span><span>{money(invoice.igst)}</span></div>}
            </>}
            {!!invoice.roundOff && <div className="flex justify-between text-slate-400"><span>Round Off:</span><span>{invoice.roundOff > 0 ? '+' : ''}{money(invoice.roundOff)}</span></div>}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-slate-800">
            <span className="font-bold text-sm uppercase">Grand Total</span>
            <span className="font-bold text-lg">{money(invoice.totalAmount)}</span>
          </div>
          <p className="text-[10px] italic text-slate-500 mt-1 leading-snug">{amountInWords(invoice.totalAmount)}</p>
        </div>
      </div>

      {/* Payment / QR / Declarations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 pt-3 border-t border-slate-200">
        <div className="md:col-span-2 space-y-2">
          {(co.bankName || co.bankAccountNo || co.upiId) && (
            <p className="text-[11px] text-slate-600">
              <span className="font-bold">Payment Details: </span>
              {[co.bankName, co.bankAccountNo && `A/c ${co.bankAccountNo}`, co.bankIfsc, co.upiId && `UPI: ${co.upiId}`].filter(Boolean).join(' | ')}
            </p>
          )}
          {declarations.map((d, i) => <p key={i} className="text-[10px] text-slate-500 leading-snug">* {d}</p>)}
          <p className="text-[10px] text-slate-400">E.&O.E. All prices inclusive of taxes as per MRP where applicable.</p>
        </div>
        <div className="flex flex-col items-end justify-between">
          {upiPayload && (
            <div className="text-center mb-2">
              <img src={upiPayload.qr} alt="UPI QR" className="w-24 h-24 border border-slate-200 rounded p-0.5" />
              <p className="text-[9px] text-slate-400 mt-0.5">Scan to Pay via UPI</p>
            </div>
          )}
          <div className="text-center min-w-[160px]">
            <p className="text-xs font-bold">For {co.name || store}</p>
            {(co.pharmacistSignature || company?.pharmacistSignature) ? (
              <img src={co.pharmacistSignature || company?.pharmacistSignature} alt="Registered pharmacist signature" className="h-12 w-auto max-w-[180px] object-contain mx-auto my-1 bg-white p-1 rounded" />
            ) : (
              <div className="h-12"></div>
            )}
            <p className="text-[11px] font-bold">Registered Pharmacist</p>
            {(co.pharmacistName || company?.pharmacistName) && <p className="text-[10px] font-semibold">{co.pharmacistName || company?.pharmacistName}</p>}
            {(co.pharmacistRegNo || company?.pharmacistRegNo) && <p className="text-[10px] font-mono text-slate-500">Reg No: {co.pharmacistRegNo || company?.pharmacistRegNo}</p>}
            <p className="text-[10px] text-slate-400 border-t border-slate-300 pt-1 mt-1 px-4">Authorised Signatory</p>
          </div>
        </div>
      </div>

      {copies > 1 && (
        <p className="text-center text-[9px] text-slate-300 mt-4">This is a computer generated {isComposition ? 'bill of supply' : 'tax invoice'} — Original for Recipient.</p>
      )}
    </div>
  );

  return (
    <div>
      {/* Dynamic page-size rules for the selected paper template */}
      <style>{`
        ${template === 'thermal80' ? '@media print { @page { size: 80mm auto; margin: 3mm; } }' : ''}
        ${template === 'thermal58' ? '@media print { @page { size: 58mm auto; margin: 2mm; } }' : ''}
        ${template === 'a5' ? '@media print { @page { size: A5 portrait; margin: 8mm; } }' : ''}
      `}</style>
      <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
        <PageHeader icon="receipt" title={`Invoice #${invoice.invoiceNo}`} subtitle={`${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')} • ${invoice.paymentStatus}`} />
        <div className="flex flex-wrap gap-2 items-center">
          <div className="glass-tabs inline-flex bg-white/60 border border-gray-200/60 rounded-xl p-0.5">
            {TEMPLATES.map(t => (
              <button key={t.value} type="button" onClick={() => setTemplate(t.value)} title={t.label}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${template === t.value ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={`fas fa-${t.icon} mr-1`}></i><span className="hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
          {upiId && (
            <button onClick={genUPI} disabled={upiLoading} className="btn btn-secondary">
              <i className="fas fa-qrcode mr-1"></i>{upiLoading ? '...' : 'UPI QR'}
            </button>
          )}
          <button onClick={shareWhatsApp} className="btn btn-secondary" style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}>
            <i className="fab fa-whatsapp mr-1"></i>Share
          </button>
          <button onClick={async () => {
            try {
              const blob = await API.get(`/sale-invoices/${id}/pdf`, { responseType: 'blob' });
              const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
              window.open(url, '_blank');
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            } catch (e) { alert('Could not generate PDF'); }
          }} className="btn btn-secondary"><i className="fas fa-file-pdf mr-1"></i>PDF</button>
          <button onClick={() => window.print()} className="btn btn-primary btn-glow"><i className="fas fa-print mr-1"></i>Print</button>
          <button onClick={() => navigate('/sales')} className="btn btn-secondary"><i className="fas fa-arrow-left mr-1"></i>Back</button>
        </div>
      </div>

      {/* Printable area */}
      <div className="print-area">
        {isThermal ? renderThermal() : renderTaxInvoice()}
      </div>

      {/* On-screen compliance banners */}
      <div className="no-print max-w-4xl mx-auto mt-4 space-y-2">
        {invoice.isScheduleH1 && <div className="p-3 bg-yellow-50/90 rounded-xl text-sm text-yellow-700"><i className="fas fa-exclamation-triangle mr-2"></i>This invoice contains Schedule H1 drugs and has been logged in the compliance register.</div>}
        {invoice.isScheduleX && <div className="p-3 bg-red-50/90 rounded-xl text-sm text-red-700"><i className="fas fa-skull mr-2"></i>This invoice contains Schedule X (Narcotic) drugs. Dispensing logged in narcotics register.</div>}
      </div>

      {(invoice.prescriptionFile || invoice.billFile) && (
        <div className="no-print glass-card p-6 max-w-4xl mx-auto mt-4">
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

      <GlassModal open={showQr} onClose={() => setShowQr(false)} title="Scan to Pay via UPI" size="sm">
        {upiPayload && (
          <div className="text-center space-y-4 py-2">
            <img src={upiPayload.qr} alt="UPI QR" className="mx-auto w-56 h-56 rounded-2xl border border-gray-200 shadow-sm" />
            <div>
              <p className="text-sm text-slate-500">Pay <span className="font-bold text-slate-800">₹{(invoice.totalAmount || 0).toFixed(2)}</span> to {store}</p>
              <p className="text-xs text-slate-400 mt-1">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)</p>
            </div>
            <div className="flex gap-2 justify-center">
              <a href={upiPayload.uri} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-glow">
                <i className="fas fa-mobile-alt mr-1"></i>Pay Now
              </a>
              <button onClick={() => { navigator.clipboard?.writeText(upiPayload.uri); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="btn btn-secondary">
                <i className="fas fa-copy mr-1"></i>{copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
      </GlassModal>
    </div>
  );
}
