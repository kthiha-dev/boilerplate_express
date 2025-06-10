const Bull = require('bull');
const Redis = require('ioredis');
const queueConfig = require('../config/queue');
const logger = require('../config/logger');

class QueueService {
  constructor() {
    this.redis = null;
    this.queues = new Map();
    this.processors = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the queue service
   */
  async initialize() {
    try {
      // Initialize Redis connection
      this.redis = new Redis({
        host: queueConfig.redis.host,
        port: queueConfig.redis.port,
        password: queueConfig.redis.password,
        db: queueConfig.redis.db,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });

      this.redis.on('connect', () => {
        logger.info('Queue service connected to Redis');
      });

      this.redis.on('error', (error) => {
        logger.error('Queue service Redis connection error:', error);
      });

      this.isInitialized = true;
      logger.info('Queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue service:', error);
      throw error;
    }
  }

  /**
   * Create or get a queue
   * @param {string} name - Queue name
   * @param {Object} options - Queue options
   * @returns {Bull.Queue}
   */
  getQueue(name, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Queue service not initialized. Call initialize() first.');
    }

    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const defaultOptions = {
      redis: queueConfig.redis,
      defaultJobOptions: {
        attempts: queueConfig.queue.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: queueConfig.queue.delayMultiplier,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
      ...options,
    };

    const queue = new Bull(name, defaultOptions);

    // Set up queue event listeners
    this.setupQueueEventListeners(queue, name);

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Set up event listeners for a queue
   * @param {Bull.Queue} queue - The queue instance
   * @param {string} name - Queue name
   */
  setupQueueEventListeners(queue, name) {
    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting in queue ${name}`);
    });

    queue.on('active', (job, jobPromise) => {
      logger.info(`Job ${job.id} started processing in queue ${name}`);
    });

    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed in queue ${name}`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue ${name}:`, err);
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled in queue ${name}`);
    });
  }

  /**
   * Register a processor for a queue
   * @param {string} queueName - Queue name
   * @param {Function} processor - Processor function
   * @param {Object} options - Processor options
   */
  registerProcessor(queueName, processor, options = {}) {
    const queue = this.getQueue(queueName);
    const concurrency = options.concurrency || queueConfig.queue.concurrency;

    // Store processor reference
    this.processors.set(queueName, { processor, options });

    // Register the processor
    queue.process(concurrency, async (job) => {
      try {
        logger.info(`Processing job ${job.id} of type ${queueName}`);
        const result = await processor(job.data, job);
        logger.info(`Job ${job.id} processed successfully`);
        return result;
      } catch (error) {
        logger.error(`Job ${job.id} processing failed:`, error);
        throw error;
      }
    });

    logger.info(`Registered processor for queue ${queueName} with concurrency ${concurrency}`);
  }

  /**
   * Add a job to a queue
   * @param {string} queueName - Queue name
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Bull.Job>}
   */
  async addJob(queueName, data, options = {}) {
    const queue = this.getQueue(queueName);

    const jobOptions = {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || queueConfig.queue.maxAttempts,
      ...options,
    };

    const job = await queue.add(data, jobOptions);
    logger.info(`Job ${job.id} added to queue ${queueName}`);

    return job;
  }

  /**
   * Add a delayed job to a queue
   * @param {string} queueName - Queue name
   * @param {Object} data - Job data
   * @param {number} delayMs - Delay in milliseconds
   * @param {Object} options - Additional job options
   * @returns {Promise<Bull.Job>}
   */
  async addDelayedJob(queueName, data, delayMs, options = {}) {
    return this.addJob(queueName, data, { ...options, delay: delayMs });
  }

  /**
   * Add a repeating job to a queue
   * @param {string} queueName - Queue name
   * @param {Object} data - Job data
   * @param {Object} repeatOptions - Repeat options (cron, every, etc.)
   * @param {Object} options - Additional job options
   * @returns {Promise<Bull.Job>}
   */
  async addRepeatingJob(queueName, data, repeatOptions, options = {}) {
    return this.addJob(queueName, data, { ...options, repeat: repeatOptions });
  }

  /**
   * Get job by ID
   * @param {string} queueName - Queue name
   * @param {string} jobId - Job ID
   * @returns {Promise<Bull.Job>}
   */
  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job from a queue
   * @param {string} queueName - Queue name
   * @param {string} jobId - Job ID
   * @returns {Promise<void>}
   */
  async removeJob(queueName, jobId) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  /**
   * Get queue statistics
   * @param {string} queueName - Queue name
   * @returns {Promise<Object>}
   */
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
      queue.isPaused(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused,
    };
  }

  /**
   * Pause a queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Clean old jobs from a queue
   * @param {string} queueName - Queue name
   * @param {number} gracePeriod - Grace period in milliseconds
   * @param {string} status - Job status to clean ('completed', 'failed', etc.)
   * @returns {Promise<number>}
   */
  async cleanQueue(queueName, gracePeriod = 24 * 60 * 60 * 1000, status = 'completed') {
    const queue = this.getQueue(queueName);
    const cleanedJobs = await queue.clean(gracePeriod, status);
    logger.info(`Cleaned ${cleanedJobs.length} ${status} jobs from queue ${queueName}`);
    return cleanedJobs.length;
  }

  /**
   * Close all queues and Redis connection
   * @returns {Promise<void>}
   */
  async shutdown() {
    logger.info('Shutting down queue service...');

    // Close all queues
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        logger.info(`Queue ${name} closed`);
      } catch (error) {
        logger.error(`Error closing queue ${name}:`, error);
      }
    }

    // Close Redis connection
    if (this.redis) {
      try {
        await this.redis.disconnect();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }

    this.queues.clear();
    this.processors.clear();
    this.isInitialized = false;

    logger.info('Queue service shutdown complete');
  }
}

// Create singleton instance
const queueService = new QueueService();

module.exports = queueService;
