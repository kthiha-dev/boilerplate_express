const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransporter(config.email.smtp);

/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @param {Array} attachments
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html, attachments = []) => {
  const msg = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
    attachments,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  const html = `<div style="margin:30px auto;width:600px;padding:20px;border:1px solid #eee"><h1 style="color:#1e3a8a">Reset your password</h1><p style="color:#374151">Dear user,</p><p style="color:#374151">To reset your password, click on this link: <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p><p style="color:#374151">If you did not request any password resets, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  const html = `<div style="margin:30px auto;width:600px;padding:20px;border:1px solid #eee"><h1 style="color:#1e3a8a">Verify your email</h1><p style="color:#374151">Dear user,</p><p style="color:#374151">To verify your email, click on this link: <a href="${verificationEmailUrl}">${verificationEmailUrl}</a></p><p style="color:#374151">If you did not create an account, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
