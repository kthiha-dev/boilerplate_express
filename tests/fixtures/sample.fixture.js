const { faker } = require('@faker-js/faker');

const userOne = {
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: faker.internet.email().toLowerCase(),
  password: 'password',
  role: 'user',
  isEmailVerified: false,
};

module.exports = {
  userOne,
};
