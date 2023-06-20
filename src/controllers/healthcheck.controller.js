const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const healthCheck = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).send({ success: true, message: 'System is healthy', data: null });
});

module.exports = {
  healthCheck,
};
