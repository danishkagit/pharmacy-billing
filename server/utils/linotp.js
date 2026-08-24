const axios = require('axios');
const https = require('https');
const qs = require('querystring');

// LinOTP (https://linotp.org — open-source, self-hosted 2FA/MFA) integration.
// Supports TOTP, HOTP, SMS tokens, Email tokens, etc.
//
// Environment variables:
//   LINOTP_BASE_URL          e.g. https://linotp.yourpharmacy.in or http://localhost:5001
//   LINOTP_REALM             (optional) LinOTP realm/resolver name
//   LINOTP_USERNAME_FIELD    'email' (default) or 'phone' — identifier passed to LinOTP
//   LINOTP_SSL_VERIFY        'false' to bypass self-signed certificate errors

const BASE = process.env.LINOTP_BASE_URL ? process.env.LINOTP_BASE_URL.replace(/\/$/, '') : '';
const REALM = process.env.LINOTP_REALM;
const USERNAME_FIELD = process.env.LINOTP_USERNAME_FIELD || 'email';
const SSL_VERIFY = process.env.LINOTP_SSL_VERIFY !== 'false';

const isConfigured = () => Boolean(BASE);

// Axios instance with optional self-signed HTTPS agent
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: SSL_VERIFY,
  }),
  timeout: 15000,
});

function buildBody(params) {
  const body = { ...params };
  if (REALM) body.realm = REALM;
  return qs.stringify(body);
}

async function post(path, params) {
  if (!isConfigured()) {
    throw new Error('LinOTP is not configured (LINOTP_BASE_URL missing)');
  }
  const res = await axiosInstance.post(`${BASE}${path}`, buildBody(params), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    validateStatus: null,
  });
  return res.data || {};
}

// Ask LinOTP to generate/dispatch an OTP challenge for this user.
async function triggerChallenge(username) {
  let data = await post('/validate/triggerchallenge', { user: username });
  if (!data?.result?.status && !data?.result?.value) {
    // Fallback: PIN-less check which triggers challenge dispatch on challenge-response tokens
    data = await post('/validate/check', { user: username, pass: '' });
  }
  return data;
}

// Returns true when LinOTP accepts the token/OTP.
async function validateOtp(username, otp) {
  const data = await post('/validate/check', {
    user: username,
    pass: String(otp || '').trim(),
  });
  
  // LinOTP standard JSON response:
  // { "version": "...", "result": { "status": true, "value": true }, "id": 0 }
  return data?.result?.value === true;
}

module.exports = {
  isConfigured,
  triggerChallenge,
  validateOtp,
  USERNAME_FIELD,
};
