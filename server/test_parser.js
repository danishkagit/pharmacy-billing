const { parseCsvTemplate } = require('./parser');

const csvPath = 'D:/Downloads/PharmacyBill Templates/21242229142_443TB1334561.csv';

try {
  const result = parseCsvTemplate(csvPath);
  console.log('CSV Parsed Successfully:');
  console.log('Invoice No:', result.invoiceNo);
  console.log('Invoice Date:', result.invoiceDate);
  console.log('Supplier:', result.supplier);
  console.log('Items Count:', result.items.length);
  console.log('First Item:', JSON.stringify(result.items[0], null, 2));
  console.log('Freight:', result.freight);
  console.log('Platform Fees:', result.platformFees);
  console.log('COD Charges:', result.codCharges);
  console.log('Discount:', result.discount);
  console.log('Subtotal:', result.subtotal);
  console.log('Total Tax:', result.totalTax);
  console.log('Total Amount:', result.totalAmount);
} catch (error) {
  console.error('Error parsing CSV:', error.message);
  console.error(error.stack);
}