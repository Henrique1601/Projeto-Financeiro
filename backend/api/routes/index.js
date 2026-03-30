const { authenticate } = require('../middleware/auth');
const { ensureDbInit, pool } = require('../config/database');
const authCtrl = require('../controllers/authController');
const financeiroCtrl = require('../controllers/financeiroController');
const express = require('express');
const router = express.Router();

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

module.exports = router;
