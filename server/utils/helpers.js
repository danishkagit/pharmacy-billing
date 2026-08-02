function calculateGST(amount, gstRate, isInterState = false) {
  const gstAmount = (amount * gstRate) / 100;
  if (isInterState) {
    return { igst: gstAmount, cgst: 0, sgst: 0, totalTax: gstAmount };
  }
  return {
    igst: 0,
    cgst: gstAmount / 2,
    sgst: gstAmount / 2,
    totalTax: gstAmount
  };
}

function roundOff(num) {
  return Math.round(num * 100) / 100;
}

function generateInvoiceNumber(prefix, counter) {
  return `${prefix}${String(counter).padStart(5, '0')}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  let start, end;
  switch (filter) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 86400000);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + 7 * 86400000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(0);
      end = customEnd ? new Date(customEnd) : new Date();
      if (!isNaN(end.getTime())) end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(0);
      end = new Date();
  }
  return { start, end };
}

module.exports = { calculateGST, roundOff, generateInvoiceNumber, formatCurrency, getDateRange, endOfDay };

function endOfDay(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return d;
  d.setHours(23, 59, 59, 999);
  return d;
}
