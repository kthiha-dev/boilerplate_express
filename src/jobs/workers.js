const queueService = require('../services/queue.service');
const { processEmailJob, processNotificationJob } = require('./processors');
const logger = require('../config/logger');

/**
 * Initialize all queue workers
 */
const initializeWorkers = async () => {
  try {
    logger.info('Initializing queue workers...');

    // Initialize queue service
    await queueService.initialize();

    // Register processors
    queueService.registerProcessor('email', processEmailJob, { concurrency: 5 });
    queueService.registerProcessor('notification', processNotificationJob, { concurrency: 10 });

    // Add more processors as needed
    // queueService.registerProcessor('image-processing', processImageJob, { concurrency: 2 });
    // queueService.registerProcessor('data-export', processDataExportJob, { concurrency: 1 });

    logger.info('Queue workers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize queue workers:', error);
    throw error;
  }
};

/**
 * Shutdown all workers gracefully
 */
const shutdownWorkers = async () => {
  try {
    logger.info('Shutting down queue workers...');
    await queueService.shutdown();
    logger.info('Queue workers shutdown complete');
  } catch (error) {
    logger.error('Error shutting down queue workers:', error);
    throw error;
  }
};

module.exports = {
  initializeWorkers,
  shutdownWorkers,
};