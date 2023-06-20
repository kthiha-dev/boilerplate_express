const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');

describe('Health Check routes', () => {
  describe('GET /v1/health-check', () => {
    test('should return status code OK when running in health-check', async () => {
      await request(app).get('/v1/health-check').send().expect(httpStatus.OK);
    });
  });
});
