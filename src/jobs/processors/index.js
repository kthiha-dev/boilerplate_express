// src/jobs/processors/index.js
const { processEmailJob } = require('./email.processor');
const { processNotificationJob } = require('./notification.processor');

module.exports = {
  processEmailJob,
  processNotificationJob,
};
