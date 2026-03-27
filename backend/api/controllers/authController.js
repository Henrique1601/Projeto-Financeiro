const { registerUser, loginUser, refreshToken } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;
    const result = await registerUser(nome, sobrenome, email, senha);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const result = await loginUser(email, senha);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await refreshToken(authHeader);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const authService = require('../services/authService');
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, senha } = req.body;
    const authService = require('../services/authService');
    const result = await authService.resetPassword(email, code, senha);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, forgotPassword, resetPassword };
