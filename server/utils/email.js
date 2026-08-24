const nodemailer = require('nodemailer');

// Free & Open-Source Email Delivery Service using Nodemailer
// Supports standard SMTP, Gmail App Passwords, Brevo/Sendgrid free tiers, or self-hosted mailers.

const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"CalcuttaRx" <noreply@calcuttarx.com>';

let transporter = null;

function getTransporter() {
  if (!transporter && SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    });
  }
  return transporter;
}

const isConfigured = () => Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

/**
 * Send an email message
 */
async function sendMail({ to, subject, html, text }) {
  const mailer = getTransporter();
  
  if (!mailer) {
    console.warn(`[MAIL NOT CONFIGURED] To: ${to} | Subject: ${subject}`);
    if (text) console.warn(`[MAIL CONTENT]:\n${text}`);
    return {
      success: true,
      simulated: true,
      message: 'Email service not configured with live SMTP. Simulated delivery logged to console.'
    };
  }

  try {
    const info = await mailer.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send 6-digit OTP for Email Sign-in
 */
async function sendLoginOtp(email, otp, name = '') {
  const subject = `${otp} is your CalcuttaRx Sign-In Code`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #0284c7; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Calcutta<span style="color: #10b981;">Rx</span></h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Secure Authentication</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello${name ? ` <strong>${name}</strong>` : ''},</p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b;">Use the one-time code below to sign in to your pharmacy account:</p>
        
        <div style="background: #ffffff; border: 2px dashed #0284c7; border-radius: 10px; padding: 14px; display: inline-block; min-width: 180px; margin: 8px 0 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
        </div>

        <p style="margin: 0; font-size: 12px; color: #94a3b8;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        <p style="margin: 0;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  return sendMail({
    to: email,
    subject,
    html,
    text: `Your CalcuttaRx sign-in OTP is ${otp}. Valid for 10 minutes. Never share this code.`,
  });
}

/**
 * Send Password Reset OTP
 */
async function sendPasswordResetOtp(email, otp, name = '') {
  const subject = `${otp} is your CalcuttaRx Password Reset Code`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #0284c7; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Calcutta<span style="color: #10b981;">Rx</span></h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Password Reset Request</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Hello${name ? ` <strong>${name}</strong>` : ''},</p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b;">We received a request to reset your password. Use this OTP code to set a new password:</p>
        
        <div style="background: #ffffff; border: 2px dashed #10b981; border-radius: 10px; padding: 14px; display: inline-block; min-width: 180px; margin: 8px 0 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
        </div>

        <p style="margin: 0; font-size: 12px; color: #94a3b8;">This OTP expires in <strong>10 minutes</strong>.</p>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        <p style="margin: 0;">If you didn't request a password reset, your account is still secure and no changes were made.</p>
      </div>
    </div>
  `;
  return sendMail({
    to: email,
    subject,
    html,
    text: `Your CalcuttaRx password reset OTP is ${otp}. Valid for 10 minutes.`,
  });
}

/**
 * Send Email Verification Code & Link
 */
async function sendVerificationEmail(email, otp, verificationUrl, name = '') {
  const subject = `Verify your email address - CalcuttaRx`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: #0284c7; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Calcutta<span style="color: #10b981;">Rx</span></h2>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Email Verification</p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #f1f5f9;">
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #334155;">Welcome to CalcuttaRx${name ? `, <strong>${name}</strong>` : ''}!</p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b;">Please verify your email address to secure your account. Enter this 6-digit code:</p>
        
        <div style="background: #ffffff; border: 2px dashed #0284c7; border-radius: 10px; padding: 14px; display: inline-block; min-width: 180px; margin: 8px 0 16px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
        </div>

        ${verificationUrl ? `
          <div style="margin-top: 16px;">
            <a href="${verificationUrl}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
        ` : ''}

        <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">This code will expire in 24 hours.</p>
      </div>
    </div>
  `;
  return sendMail({
    to: email,
    subject,
    html,
    text: `Your CalcuttaRx email verification code is ${otp}. Link: ${verificationUrl}`,
  });
}

module.exports = {
  sendMail,
  sendLoginOtp,
  sendPasswordResetOtp,
  sendVerificationEmail,
  isConfigured,
};
