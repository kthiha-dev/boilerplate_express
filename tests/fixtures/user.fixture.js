const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const { Role } = require('@prisma/client');
const prisma = require('../../src/client');

const password = 'password1';
const salt = bcrypt.genSaltSync(8);

const userOne = {
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.USER,
  isEmailVerified: false,
};

const userTwo = {
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.USER,
  isEmailVerified: false,
};

const admin = {
  name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  email: faker.internet.email().toLowerCase(),
  password,
  role: Role.ADMIN,
  isEmailVerified: false,
};

const insertUsers = async (users) => {
  await prisma.user.createMany({
    data: users.map((user) => ({ ...user, password: bcrypt.hashSync(user.password, salt) })),
  });
};

module.exports = {
  userOne,
  userTwo,
  admin,
  insertUsers,
};
