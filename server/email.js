const Imap = require('imap');
const { simpleParser } = require('mailer-debugger');
const async = require('async');

/**
 * Fetch emails from supplier inbox for purchase invoice data extraction
 * @param {Object} options - Email connection options
 * @param {string} options.email - Supplier email address
 * @param {string} options.password - Email password
 * @param {string} options.host - IMAP host
 * @param {string} options.port - IMAP port
 * @param {string} [options.searchFilter] - Custom search filter
 * @returns {Promise<Array>} - List of email attachments (CSV files)
 */
function fetchSupplierEmails(options) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: options.email,
      password: options.password,
      host: options.host || 'imap.gmail.com',
      port: options.port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err);

        const searchOpts = options.searchFilter || ['UNSEEN'];
        imap.search(searchOpts, (err, results) => {
          if (err) return reject(err);

          const fetchOps = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], markSeen: false };

          // Process each email
          async.eachLimit(results, 5, (msgNum, next) => {
            imap.fetch(msgNum, fetchOps, (err, fetchResults) => {
              if (err) return next(err);

              const msg = fetchResults[msgNum];
              if (!msg) return next();

              const attachments = [];

              // Extract attachments from the email
              if (msg.attachments) {
                msg.attachments.forEach(att => {
                  // Filter for CSV files only
                  if (att.contentType === 'text/csv' || att.filename.endsWith('.csv')) {
                    attachments.push({
                      filename: att.filename,
                      content: Buffer.from(att.body, 'utf8').toString('latin1'),
                      contentType: att.contentType
                    });
                  }
                });
              }

              // Also check text/plain body for CSV data
              if (msg.body && msg.body.text) {
                const text = msg.body.text;
                // Check if body contains CSV data
                if (text.includes('H,') || text.includes('T,') || text.includes('Invoice')) {
                  attachments.push({
                    filename: 'email-body.csv',
                    content: text,
                    contentType: 'text/plain'
                  });
                }
              }

              emails.push({
                subject: msg.headers ? msg.headers.subject : 'No Subject',
                from: msg.headers ? msg.headers.from : 'Unknown',
                date: msg.headers ? msg.headers.date : new Date(),
                attachments
              });

              next();
            });
          }, (err) => {
            if (err) return reject(err);
            resolve(emails);
            imap.close();
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.once('end', () => {});
    imap.connect();
  });
}

/**
 * Parse CSV email content and extract purchase invoice data
 * @param {string} csvContent - Raw CSV content from email
 * @returns {object} - Parsed invoice data
 */
function parseEmailCsv(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const result = {
    invoiceNo: '',
    invoiceDate: '',
    supplier: '',
    items: [],
    freight: 0,
    platformFees: 0,
    codCharges: 0,
    discount: 0,
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0
  };

  if (lines.length < 2) return result;

  // Row 0: Header metadata
  const header = lines[0].split(',');
  if (header[2]) result.invoiceNo = header[2].trim();
  if (header[3]) result.invoiceDate = header[3].trim();
  if (header[11]) result.supplier = header[11].trim();

  // Parse medicine items
  for (let i = 1; i < lines.length - 1; i++) {
    const row = lines[i].split(',');
    if (row[0] === 'T' && row[1] === 'RS') {
      const item = {
        medicineName: row[4] || row[5] || '',
        hsn: row[6] || '',
        batchNo: row[8] || '',
        expiryDate: row[9] || '',
        mrp: parseFloat(row[11] || '0'),
        rate: parseFloat(row[12] || '0'),
        qty: parseInt(row[13] || '0', 10),
        freeQty: parseInt(row[14] || '0', 10),
        schemeDisc: parseFloat(row[15] || '0'),
        amount: parseFloat(row[16] || '0'),
        gstPercent: parseFloat(row[17] || '0'),
        cgstPercent: parseFloat(row[18] || '0'),
        sgstPercent: parseFloat(row[19] || '0'),
        netRate: parseFloat(row[20] || '0'),
        cgstAmount: parseFloat(row[21] || '0'),
        sgstAmount: parseFloat(row[22] || '0')
      };
      result.items.push(item);
    }
  }

  // Parse summary line (starts with 'F')
  const summaryLine = lines[lines.length - 2]?.trim();
  if (summaryLine && summaryLine.startsWith('F')) {
    const parts = summaryLine.split(',');
    result.discount = parseFloat(parts[2] || '0');
    result.totalAmount = parseFloat(parts[parts.length - 1] || '0');
  }

  // Calculate totals
  result.subtotal = result.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  result.totalTax = result.items.reduce((sum, item) => sum + (item.cgstAmount || 0) + (item.sgstAmount || 0), 0);

  return result;
}

/**
 * Main function to fetch and process purchase emails
 * @param {Object} config - Email configuration
 * @param {string} config.email - Supplier email
 * @param {string} config.password - Email password
 * @param {string} config.host - IMAP host
 * @param {Object} invoiceData - Additional invoice data from form
 * @returns {Promise<object>} - Created purchase invoice
 */
async function processPurchaseEmails(config, invoiceData = {}) {
  try {
    // Fetch emails from supplier inbox
    const emails = await fetchSupplierEmails({
      email: config.email,
      password: config.password,
      host: config.host,
      searchFilter: ['UNSEEN'] // Only fetch unread emails
    });

    if (!emails || emails.length === 0) {
      return { success: false, error: 'No emails found in supplier inbox' };
    }

    // Process each email looking for CSV attachments
    let parsedData = null;

    for (const email of emails) {
      for (const attachment of email.attachments) {
        if (attachment.filename.endsWith('.csv') || attachment.filename === 'email-body.csv') {
          parsedData = parseEmailCsv(attachment.content);
          if (parsedData && parsedData.items.length > 0) {
            break;
          }
        }
      }
      if (parsedData && parsedData.items.length > 0) break;
    }

    if (!parsedData || parsedData.items.length === 0) {
      return { success: false, error: 'No valid CSV data found in emails' };
    }

    // Generate invoice number
    const count = await require('../models/PurchaseInvoice').countDocuments({ companyRef: invoiceData.companyId });
    const invNo = `PI${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    const subtotal = parsedData.items.reduce((s, item) => s + (item.amount || 0), 0);
    const totalTax = parsedData.items.reduce((s, item) => s + (item.cgstAmount || 0) + (item.sgstAmount || 0), 0);
    const totalAmount = subtotal + totalTax - (parsedData.discount || 0) + (invoiceData.freight || 0) + (invoiceData.platformFees || 0) + (invoiceData.codCharges || 0);

    // Create purchase invoice
    const PurchaseInvoice = require('../models/PurchaseInvoice');
    const Batch = require('../models/Batch');
    const Supplier = require('../models/Supplier');

    const purchaseInvoice = await PurchaseInvoice.create({
      invoiceNo: parsedData.invoiceNo || invoiceData.invoiceNo || invNo,
      supplier: invoiceData.supplierId || (parsedData.supplier ? { name: parsedData.supplier } : undefined),
      purchaseOrder: invoiceData.purchaseOrder,
      invoiceDate: parsedData.invoiceDate || invoiceData.invoiceDate || new Date(),
      receivedDate: new Date(),
      billFile: `/uploads/email-${Date.now()}.csv`,
      batches: parsedData.items.map(item => ({
        medicine: item.medicineId || '', // Would need medicine lookup
        medicineName: item.medicineName,
        batchNo: item.batchNo || '',
        mfgDate: '', // Not in email
        expiryDate: item.expiryDate || '',
        mrp: item.mrp || 0,
        rate: item.rate || 0,
        qty: item.qty || 1,
        freeQty: item.freeQty || 0,
        schemeDisc: item.schemeDisc || 0,
        amount: item.amount || 0,
        gstAmount: item.cgstAmount + item.sgstAmount || 0
      })),
      subtotal,
      discountAmount: parsedData.discount || 0,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      taxAmount: totalTax,
      freight: invoiceData.freight || parsedData.freight || 0,
      totalAmount,
      notes: `Auto-created from supplier email: ${email.from}`,
      branch: invoiceData.branchId || '',
      companyRef: invoiceData.companyId,
      createdBy: invoiceData.createdBy
    });

    // Mark emails as read after successful processing
    // (Would need to implement imap.clearflag here)

    return {
      success: true,
      data: purchaseInvoice,
      parsedData,
      message: `Purchase invoice created from ${emails.length} email(s)`
    };

  } catch (error) {
    console.error('Error processing purchase emails:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { fetchSupplierEmails, parseEmailCsv, processPurchaseEmails };