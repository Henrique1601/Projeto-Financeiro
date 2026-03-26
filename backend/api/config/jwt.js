module.exports = {
  secret: process.env.JWT_SECRET || '1234',
  expiresIn: '2h'
};
