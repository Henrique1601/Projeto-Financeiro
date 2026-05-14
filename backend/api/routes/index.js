const { authenticate } = require('../middleware/auth');
const { ensureDbInit, pool } = require('../config/database');
const authCtrl = require('../controllers/authController');
const financeiroCtrl = require('../controllers/financeiroController');
const express = require('express');
const { createPassport } = require('../services/passportConfig');
const router = express.Router();

const passport = createPassport();
router.use(passport.initialize());

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://projeto-financeiro-frontend.vercel.app';

router.post('/register', ensureDbInit, authCtrl.register);
router.post('/login', ensureDbInit, authCtrl.login);
router.post('/login/social', authenticate, ensureDbInit, authCtrl.loginSocial);
router.post('/refresh-token', ensureDbInit, authCtrl.refresh);
router.post('/forgot-password', ensureDbInit, authCtrl.forgotPassword);
router.post('/reset-password', ensureDbInit, authCtrl.resetPassword);
router.put('/change-password', authenticate, ensureDbInit, authCtrl.changePassword);

router.get('/profile', authenticate, ensureDbInit, authCtrl.getProfile);
router.put('/profile', authenticate, ensureDbInit, authCtrl.updateProfile);

router.post('/salvar', authenticate, ensureDbInit, financeiroCtrl.salvar);
router.get('/listar', authenticate, ensureDbInit, financeiroCtrl.listar);
router.delete('/deletar', authenticate, ensureDbInit, financeiroCtrl.deletar);
router.put('/editar', authenticate, ensureDbInit, financeiroCtrl.editar);
router.post('/importar', authenticate, ensureDbInit, financeiroCtrl.importar);
router.post('/importar/auto', authenticate, ensureDbInit, financeiroCtrl.importarAuto);

router.get('/categorias/palavras', authenticate, ensureDbInit, (req, res) => {
  const authService = require('../services/authService');
  res.json({ categorias: authService.CATEGORIAS_PALAVRAS });
});

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      features: {
        socialLogin: !!(process.env.GOOGLE_CLIENT_ID && process.env.GITHUB_CLIENT_ID),
        notifications: true,
        autoCategorize: true
      }
    });
  } catch (err) {
    res.status(200).json({ status: 'OK', database: 'error', error: err.message });
  }
});

// OAuth routes (no ensureDbInit needed - passport verifies tokens before DB)
function requireStrategy(name) {
  return (req, res, next) => {
    if (!passport._strategy(name)) {
      return res.status(501).json({ error: `Login com ${name} não configurado. Configure as variáveis de ambiente.` });
    }
    next();
  };
}

router.get('/auth/google', requireStrategy('google'), passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/auth/google/callback', requireStrategy('google'), (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login/callback.html?error=${encodeURIComponent(err?.message || info?.message || 'auth_failed')}`);
    }
    res.redirect(`${FRONTEND_URL}/login/callback.html?token=${user.token}&nome=${encodeURIComponent(user.nome)}`);
  })(req, res, next);
});

router.get('/auth/github', requireStrategy('github'), passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/auth/github/callback', requireStrategy('github'), (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login/callback.html?error=${encodeURIComponent(err?.message || info?.message || 'auth_failed')}`);
    }
    res.redirect(`${FRONTEND_URL}/login/callback.html?token=${user.token}&nome=${encodeURIComponent(user.nome)}`);
  })(req, res, next);
});

router.get('/auth/failure', (req, res) => {
  res.redirect(`${FRONTEND_URL}/login/callback.html?error=auth_cancelled`);
});

module.exports = router;
