const { User, Role, Prisma } = require('@prisma/client');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const prisma = require('../client');
const { encryptPassword } = require('../utils/encryption');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise}
 */
const createUser = async (userBody) => {
  const { email, name, password, role } = userBody;
  if (await getUserByEmail(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return prisma.user.create({
    data: {
      email,
      name,
      password: await encryptPassword(password),
      role,
    },
  });
};

/**
 * Get user by email
 * @param {string} email
 * @param {Array<Key>} keys
 * @returns {Promise}
 */
const getUserByEmail = async (
  email,
  keys = ['id', 'email', 'name', 'password', 'role', 'isEmailVerified', 'createdAt', 'updatedAt']
) => {
  return prisma.user.findUnique({
    where: { email },
    select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {}),
  });
};

module.exports = {
  createUser,
  getUserByEmail,
};
