const axios = require('axios');
const SmsLog = require('../models/SmsLog');

// Generic SMS / WhatsApp notification gateway for customer invoices & alerts
const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'PHARMA';
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;

async function sendSMS(recipient, message, type = 'other', reference = null, referenceModel = null, branch = null, companyRef = null, sentBy = null) {
  try {
    if (!SMS_API_KEY && !SMS_GATEWAY_URL) {
      console.warn('SMS gateway not configured. SMS logged but not dispatched.');
      return { success: false, error: 'SMS gateway not configured' };
    }

    let response = { data: { status: 'simulated' } };
    if (SMS_GATEWAY_URL) {
      response = await axios.post(SMS_GATEWAY_URL, {
        sender: SMS_SENDER_ID,
        mobiles: '91' + recipient.replace(/[^0-9]/g, ''),
        message: message
      }, {
        headers: { 'Authorization': `Bearer ${SMS_API_KEY}`, 'Content-Type': 'application/json' }
      });
    }

    await SmsLog.create({
      recipient,
      type,
      channel: 'sms',
      message,
      referenceId: reference,
      referenceModel,
      status: response.data?.type === 'success' || response.data?.status === 'success' ? 'sent' : 'sent',
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
    if (!SMS_API_KEY && !SMS_GATEWAY_URL) {
      console.warn('WhatsApp gateway not configured.');
      return { success: false, error: 'WhatsApp gateway not configured' };
    }

    let response = { data: { status: 'simulated' } };
    if (SMS_GATEWAY_URL) {
      response = await axios.post(`${SMS_GATEWAY_URL}/whatsapp`, {
        sender: SMS_SENDER_ID,
        mobiles: '91' + recipient.replace(/[^0-9]/g, ''),
        message: message
      }, {
        headers: { 'Authorization': `Bearer ${SMS_API_KEY}`, 'Content-Type': 'application/json' }
      });
    }

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
