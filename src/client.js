const { PrismaClient } = require('@prisma/client');
const config = require('./config/config');

// add prisma to the NodeJS global type
global.prisma = global.prisma || new PrismaClient();

if (config.env === 'development') {
  global.prisma = global.prisma || new PrismaClient();
}

module.exports = global.prisma;
