const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { nome, sobrenome, email, senha } = req.body;
    const result = await authService.registerUser(nome, sobrenome, email, senha);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const result = await authService.loginUser(email, senha);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const loginSocial = async (req, res, next) => {
  try {
    const result = await authService.loginSocial(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const result = await authService.refreshToken(authHeader);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, senha } = req.body;
    const result = await authService.resetPassword(email, code, senha);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const result = await authService.changePassword(req.user.id, senhaAtual, novaSenha);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await authService.getUserProfile(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateUserProfile(req.user.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  register, 
  login, 
  loginSocial,
  refresh, 
  forgotPassword, 
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};
