const logger = require('../../config/logger');
const { sendEmail } = require('../../services/email.service');

/**
 * Process email jobs
 * @param {Object} data - Job data containing email details
 * @param {Object} job - Bull job instance
 * @returns {Promise<Object>}
 */
const processEmailJob = async (data, job) => {
  const { to, subject, text, html, attachments } = data;

  try {
    logger.info(`Processing email job ${job.id} for recipient: ${to}`);

    // Update job progress
    await job.progress(25);

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      throw new Error('Missing required email fields: to, subject, and text/html');
    }

    await job.progress(50);

    // Send the email
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      attachments,
    });

    await job.progress(100);

    logger.info(`Email job ${job.id} completed successfully`);
    return {
      success: true,
      messageId: result.messageId,
      recipient: to,
      sentAt: new Date(),
    };
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
};

module.exports = {
  processEmailJob,
};