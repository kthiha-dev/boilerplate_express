import bcrypt from 'bcryptjs';

const encryptPassword = async (password) => {
  const encryptedPassword = await bcrypt.hash(password, 8);
  return encryptedPassword;
};

const isPasswordMatch = async (password, userPassword) => {
  return bcrypt.compare(password, userPassword);
};

module.exports = {
  encryptPassword,
  isPasswordMatch,
};
