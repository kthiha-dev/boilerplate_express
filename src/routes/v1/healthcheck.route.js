const express = require('express');
const healthCheckController = require('../../controllers/healthcheck.controller');

const router = express.Router();

// Didn't work for now
/**
 * @swagger
 * /health-check:
 *  get:
 *     tags:
 *     - Healthcheck
 *     description: Returns API operational status
 *     responses:
 *       200:
 *         description: API is  running
 */
router.route('/health-check').get(healthCheckController.healthCheck);
module.exports = router;
