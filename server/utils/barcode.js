const bwipjs = require('bwip-js');

function generateBarcode(text, options = {}) {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: options.bcid || 'code128',
      text: text,
      scale: options.scale || 3,
      height: options.height || 10,
      includetext: options.includetext !== false,
      textxalign: 'center',
      backgroundcolor: options.bgcolor || 'FFFFFF',
      paddingwidth: options.padding || 5
    }, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer.toString('base64'));
    });
  });
}

function generateBatchQR(batchData) {
  const qrData = JSON.stringify({
    medicine: batchData.medicineName,
    batch: batchData.batchNo,
    expiry: batchData.expiryDate,
    mrp: batchData.mrp,
    rack: batchData.location
  });
  return generateBarcode(qrData, { bcid: 'qrcode', scale: 5, height: 10, includetext: false });
}

module.exports = { generateBarcode, generateBatchQR };
