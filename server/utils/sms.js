const axios = require('axios');
const SmsLog = require('../models/SmsLog');

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'PHARMA';

async function sendSMS(recipient, message, type = 'other', reference = null, referenceModel = null, branch = null, companyRef = null, sentBy = null) {
  try {
    if (!MSG91_AUTH_KEY) {
      console.warn('MSG91_AUTH_KEY not configured. SMS not sent.');
      return { success: false, error: 'MSG91 not configured' };
    }

    const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
      sender: MSG91_SENDER_ID,
      mobiles: '91' + recipient.replace(/[^0-9]/g, ''),
      message: message
    }, {
      headers: { 'authkey': MSG91_AUTH_KEY, 'Content-Type': 'application/json' }
    });

    await SmsLog.create({
      recipient,
      type,
      channel: 'sms',
      message,
      referenceId: reference,
      referenceModel,
      status: response.data?.type === 'success' ? 'sent' : 'failed',
      providerResponse: response.data,
      branch,
      companyRef,
      sentBy
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('SMS send error:', error.message);
    try {
      await SmsLog.create({
        recipient,
        type,
        channel: 'sms',
        message,
        referenceId: reference,
        referenceModel,
        status: 'failed',
        providerResponse: { error: error.message },
        branch,
        companyRef,
        sentBy
      });
    } catch (e) { }
    return { success: false, error: error.message };
  }
}

async function sendWhatsApp(recipient, message, type = 'other', reference = null, referenceModel = null, branch = null, companyRef = null, sentBy = null) {
  try {
    if (!MSG91_AUTH_KEY) {
      console.warn('MSG91_AUTH_KEY not configured. WhatsApp not sent.');
      return { success: false, error: 'MSG91 not configured' };
    }

    const response = await axios.post('https://api.msg91.com/api/v5/whatsapp/send', {
      sender: MSG91_SENDER_ID,
      mobiles: '91' + recipient.replace(/[^0-9]/g, ''),
      message: message
    }, {
      headers: { 'authkey': MSG91_AUTH_KEY, 'Content-Type': 'application/json' }
    });

    await SmsLog.create({
      recipient,
      type,
      channel: 'whatsapp',
      message,
      referenceId: reference,
      referenceModel,
      status: 'sent',
      providerResponse: response.data,
      branch,
      companyRef,
      sentBy
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    try {
      await SmsLog.create({
        recipient,
        type,
        channel: 'whatsapp',
        message,
        referenceId: reference,
        referenceModel,
        status: 'failed',
        providerResponse: { error: error.message },
        branch,
        companyRef,
        sentBy
      });
    } catch (e) { }
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS, sendWhatsApp };
