const authService = require('../services/authService');
const twoFAService = require('../services/twoFAService');

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
    const { email, senha, trustToken } = req.body;
    const result = await authService.loginUser(email, senha, trustToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const login2FA = async (req, res, next) => {
  try {
    const { tempToken, code, method, trustDevice } = req.body;
    if (!tempToken || !code || !method) {
      throw new Error('Token temporário, código e método são obrigatórios.');
    }
    const user = await twoFAService.verifyLogin2FA(tempToken, code, method);
    const jwt = require('jsonwebtoken');
    const { secret, expiresIn } = require('../config/jwt');
    const token = jwt.sign(
      { id: user.id, nome: user.nome, sobrenome: user.sobrenome, email: user.email },
      secret,
      { expiresIn }
    );
    let trustToken;
    if (trustDevice) {
      trustToken = await twoFAService.generateTrustToken(user.id);
    }
    res.json({ token, trustToken, nome: user.nome, sobrenome: user.sobrenome, email: user.email });
  } catch (err) {
    next(err);
  }
};

const resend2FACode = async (req, res, next) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) throw new Error('Token temporário é obrigatório.');
    const jwt = require('jsonwebtoken');
    const { secret } = require('../config/jwt');
    const decoded = jwt.verify(tempToken, secret);
    if (decoded.purpose !== '2fa') throw new Error('Token inválido.');
    const result = await twoFAService.sendLoginEmailCode(decoded.id);
    res.json({ message: 'Código enviado.' });
  } catch (err) {
    next(err);
  }
};

const get2FAStatus = async (req, res, next) => {
  try {
    const status = await twoFAService.get2FAStatus(req.user.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const { method } = req.body;
    if (!method || !['totp', 'email'].includes(method)) {
      throw new Error('Método inválido. Use "totp" ou "email".');
    }

    if (method === 'totp') {
      const user = await authService.getUserProfile(req.user.id);
      const result = await twoFAService.setupTOTP(req.user.id, user.email);
      return res.json(result);
    }

    if (method === 'email') {
      const result = await twoFAService.setupEmail(req.user.id);
      return res.json(result);
    }
  } catch (err) {
    next(err);
  }
};

const verify2FASetup = async (req, res, next) => {
  try {
    const { method, code } = req.body;
    if (!method || !code) throw new Error('Método e código são obrigatórios.');

    let result;
    if (method === 'totp') {
      result = await twoFAService.verifyAndEnableTOTP(req.user.id, code);
    } else if (method === 'email') {
      result = await twoFAService.verifyAndEnableEmail(req.user.id, code);
    } else {
      throw new Error('Método inválido.');
    }

    res.json({ message: `${method === 'totp' ? 'TOTP' : 'Email'} ativado com sucesso!`, ...result });
  } catch (err) {
    next(err);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const result = await twoFAService.disable2FA(req.user.id);
    res.json(result);
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
  login2FA,
  resend2FACode,
  loginSocial,
  refresh, 
  forgotPassword, 
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  get2FAStatus,
  setup2FA,
  verify2FASetup,
  disable2FA
};
