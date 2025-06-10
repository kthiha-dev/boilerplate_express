const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const queueConfigSchema = Joi.object()
  .keys({
    REDIS_HOST: Joi.string().default('127.0.0.1'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    REDIS_DB: Joi.number().default(0),
    QUEUE_CONCURRENCY: Joi.number().default(5),
    QUEUE_MAX_ATTEMPTS: Joi.number().default(3),
    QUEUE_DELAY_MULTIPLIER: Joi.number().default(2000),
  })
  .unknown();

const { value: queueVars, error } = queueConfigSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Queue config validation error: ${error.message}`);
}

module.exports = {
  redis: {
    host: queueVars.REDIS_HOST,
    port: queueVars.REDIS_PORT,
    password: queueVars.REDIS_PASSWORD || undefined,
    db: queueVars.REDIS_DB,
  },
  queue: {
    concurrency: queueVars.QUEUE_CONCURRENCY,
    maxAttempts: queueVars.QUEUE_MAX_ATTEMPTS,
    delayMultiplier: queueVars.QUEUE_DELAY_MULTIPLIER,
  },
};
