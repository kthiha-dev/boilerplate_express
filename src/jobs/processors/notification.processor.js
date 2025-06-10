const logger = require('../../config/logger');
const prisma = require('../../client');

/**
 * Process notification jobs
 * @param {Object} data - Job data containing notification details
 * @param {Object} job - Bull job instance
 * @returns {Promise<Object>}
 */
const processNotificationJob = async (data, job) => {
  const { userId, title, message, type = 'info', metadata = {} } = data;

  try {
    logger.info(`Processing notification job ${job.id} for user: ${userId}`);

    await job.progress(25);

    // Validate required fields
    if (!userId || !title || !message) {
      throw new Error('Missing required notification fields: userId, title, message');
    }

    await job.progress(50);

    // Save notification to database (assuming you have a Notification model)
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata,
        isRead: false,
      },
    });

    await job.progress(75);

    // Here you could add real-time notification logic
    // For example, using WebSocket to send to connected clients
    // await sendRealTimeNotification(userId, notification);

    await job.progress(100);

    logger.info(`Notification job ${job.id} completed successfully`);
    return {
      success: true,
      notificationId: notification.id,
      userId,
      createdAt: notification.createdAt,
    };
  } catch (error) {
    logger.error(`Notification job ${job.id} failed:`, error);
    throw error;
  }
};

module.exports = {
  processNotificationJob,
};