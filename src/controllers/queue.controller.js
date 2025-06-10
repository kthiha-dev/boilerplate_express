const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const queueService = require('../services/queue.service');
const ApiError = require('../utils/ApiError');

const addEmailJob = catchAsync(async (req, res) => {
  const { to, subject, text, html, priority = 0, delay = 0 } = req.body;

  if (!to || !subject || (!text && !html)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields: to, subject, and text/html');
  }

  const job = await queueService.addJob(
    'email',
    {
      to,
      subject,
      text,
      html,
    },
    {
      priority,
      delay,
    }
  );

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Email job added to queue',
    data: {
      jobId: job.id,
      queue: 'email',
      status: 'queued',
    },
  });
});

const addNotificationJob = catchAsync(async (req, res) => {
  const { userId, title, message, type = 'info', metadata = {}, priority = 0, delay = 0 } = req.body;

  if (!userId || !title || !message) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields: userId, title, message');
  }

  const job = await queueService.addJob(
    'notification',
    {
      userId,
      title,
      message,
      type,
      metadata,
    },
    {
      priority,
      delay,
    }
  );

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Notification job added to queue',
    data: {
      jobId: job.id,
      queue: 'notification',
      status: 'queued',
    },
  });
});

const getJobStatus = catchAsync(async (req, res) => {
  const { queueName, jobId } = req.params;

  const job = await queueService.getJob(queueName, jobId);

  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  const state = await job.getState();
  const progress = job.progress();

  res.send({
    success: true,
    data: {
      jobId: job.id,
      queue: queueName,
      state,
      progress,
      data: job.data,
      createdAt: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    },
  });
});

const getQueueStats = catchAsync(async (req, res) => {
  const { queueName } = req.params;

  const stats = await queueService.getQueueStats(queueName);

  res.send({
    success: true,
    data: {
      queue: queueName,
      ...stats,
    },
  });
});

const pauseQueue = catchAsync(async (req, res) => {
  const { queueName } = req.params;

  await queueService.pauseQueue(queueName);

  res.send({
    success: true,
    message: `Queue ${queueName} paused successfully`,
  });
});

const resumeQueue = catchAsync(async (req, res) => {
  const { queueName } = req.params;

  await queueService.resumeQueue(queueName);

  res.send({
    success: true,
    message: `Queue ${queueName} resumed successfully`,
  });
});

const cleanQueue = catchAsync(async (req, res) => {
  const { queueName } = req.params;
  const { gracePeriod = 24 * 60 * 60 * 1000, status = 'completed' } = req.query;

  const cleanedCount = await queueService.cleanQueue(queueName, parseInt(gracePeriod), status);

  res.send({
    success: true,
    message: `Cleaned ${cleanedCount} ${status} jobs from queue ${queueName}`,
    data: {
      cleanedJobs: cleanedCount,
      gracePeriod: parseInt(gracePeriod),
      status,
    },
  });
});

module.exports = {
  addEmailJob,
  addNotificationJob,
  getJobStatus,
  getQueueStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
};
