const { authenticate } = require('../middleware/auth');
const { ensureDbInit, pool } = require('../config/database');
const authCtrl = require('../controllers/authController');
const financeiroCtrl = require('../controllers/financeiroController');
const recorrenteCtrl = require('../controllers/recorrenteController');
const orcamentoCtrl = require('../controllers/orcamentoController');
const metaCategoriaCtrl = require('../controllers/metaCategoriaController');
const desafioCtrl = require('../controllers/desafioController');
const categoriaCtrl = require('../controllers/categoriaController');
const comprovanteCtrl = require('../controllers/comprovanteController');
const compartilharCtrl = require('../controllers/compartilharController');
const aiCtrl = require('../controllers/aiController');
const express = require('express');
const { createPassport } = require('../services/passportConfig');
const router = express.Router();

const passport = createPassport();
router.use(passport.initialize());

const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://gestor-financeiro-proj.vercel.app' : 'http://localhost:5173');
const SPA_URL = FRONTEND_URL.replace(/\/$/, '') + '/#/callback';

router.post('/register', ensureDbInit, authCtrl.register);
router.post('/login', ensureDbInit, authCtrl.login);
router.post('/login/2fa', ensureDbInit, authCtrl.login2FA);
router.post('/login/2fa/resend', ensureDbInit, authCtrl.resend2FACode);
router.post('/login/social', authenticate, ensureDbInit, authCtrl.loginSocial);
router.post('/refresh-token', ensureDbInit, authCtrl.refresh);
router.post('/forgot-password', ensureDbInit, authCtrl.forgotPassword);
router.post('/reset-password', ensureDbInit, authCtrl.resetPassword);
router.put('/change-password', authenticate, ensureDbInit, authCtrl.changePassword);

router.get('/profile', authenticate, ensureDbInit, authCtrl.getProfile);
router.put('/profile', authenticate, ensureDbInit, authCtrl.updateProfile);

router.get('/auth/2fa/status', authenticate, ensureDbInit, authCtrl.get2FAStatus);
router.post('/auth/2fa/setup', authenticate, ensureDbInit, authCtrl.setup2FA);
router.post('/auth/2fa/verify', authenticate, ensureDbInit, authCtrl.verify2FASetup);
router.delete('/auth/2fa', authenticate, ensureDbInit, authCtrl.disable2FA);

router.post('/push/subscribe', authenticate, ensureDbInit, async (req, res, next) => {
  try {
    const notifService = require('../services/notificationService');
    const result = await notifService.saveSubscription(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/push/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(501).json({ error: 'VAPID keys not configured.' });
  res.json({ publicKey: key });
});

router.post('/salvar', authenticate, ensureDbInit, financeiroCtrl.salvar);
router.get('/listar', authenticate, ensureDbInit, financeiroCtrl.listar);
router.delete('/deletar', authenticate, ensureDbInit, financeiroCtrl.deletar);
router.post('/desfazer', authenticate, ensureDbInit, financeiroCtrl.desfazer);
router.put('/editar', authenticate, ensureDbInit, financeiroCtrl.editar);
router.post('/importar', authenticate, ensureDbInit, financeiroCtrl.importar);
router.post('/importar/auto', authenticate, ensureDbInit, financeiroCtrl.importarAuto);
router.post('/exportar/xlsx', authenticate, ensureDbInit, financeiroCtrl.exportarXlsx);
router.post('/exportar/email', authenticate, ensureDbInit, financeiroCtrl.exportarEmail);

router.post('/recorrentes', authenticate, ensureDbInit, recorrenteCtrl.criar);
router.get('/recorrentes', authenticate, ensureDbInit, recorrenteCtrl.listar);
router.put('/recorrentes/:id', authenticate, ensureDbInit, recorrenteCtrl.atualizar);
router.delete('/recorrentes/:id', authenticate, ensureDbInit, recorrenteCtrl.deletar);
router.post('/recorrentes/gerar', authenticate, ensureDbInit, recorrenteCtrl.gerar);

router.post('/orcamentos', authenticate, ensureDbInit, orcamentoCtrl.criar);
router.get('/orcamentos', authenticate, ensureDbInit, orcamentoCtrl.listar);
router.put('/orcamentos/:id', authenticate, ensureDbInit, orcamentoCtrl.atualizar);
router.delete('/orcamentos/:id', authenticate, ensureDbInit, orcamentoCtrl.deletar);
router.get('/orcamentos/verificar', authenticate, ensureDbInit, orcamentoCtrl.verificar);

router.post('/metas-categoria', authenticate, ensureDbInit, metaCategoriaCtrl.criar);
router.get('/metas-categoria', authenticate, ensureDbInit, metaCategoriaCtrl.listar);
router.put('/metas-categoria/:id', authenticate, ensureDbInit, metaCategoriaCtrl.atualizar);
router.delete('/metas-categoria/:id', authenticate, ensureDbInit, metaCategoriaCtrl.deletar);

router.post('/desafios', authenticate, ensureDbInit, desafioCtrl.criar);
router.get('/desafios', authenticate, ensureDbInit, desafioCtrl.listar);
router.put('/desafios/:id', authenticate, ensureDbInit, desafioCtrl.atualizar);
router.delete('/desafios/:id', authenticate, ensureDbInit, desafioCtrl.deletar);
router.post('/desafios/verificar', authenticate, ensureDbInit, desafioCtrl.verificar);

router.post('/comprovantes/signature', authenticate, ensureDbInit, comprovanteCtrl.signature);
router.post('/comprovantes', authenticate, ensureDbInit, comprovanteCtrl.criar);
router.get('/comprovantes/:lancamento_id', authenticate, ensureDbInit, comprovanteCtrl.listar);
router.delete('/comprovantes/:id', authenticate, ensureDbInit, comprovanteCtrl.deletar);

router.get('/categorias', authenticate, ensureDbInit, categoriaCtrl.listar);
router.post('/categorias', authenticate, ensureDbInit, categoriaCtrl.criar);
router.put('/categorias/:id', authenticate, ensureDbInit, categoriaCtrl.atualizar);
router.delete('/categorias/:id', authenticate, ensureDbInit, categoriaCtrl.deletar);
router.patch('/categorias/reorder', authenticate, ensureDbInit, categoriaCtrl.reordenar);

router.get('/cambio', authenticate, ensureDbInit, async (req, res, next) => {
  try {
    const { getCambio } = require('../services/cambioService');
    const moedasParam = req.query.moedas || 'USD,EUR,GBP,JPY,ARS';
    const moedas = moedasParam.split(',').map(m => m.trim().toUpperCase()).filter(Boolean);
    const result = await getCambio(moedas);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/compartilhar', authenticate, ensureDbInit, compartilharCtrl.criar);
router.get('/compartilhar/:token', ensureDbInit, compartilharCtrl.buscar);
router.get('/compartilhar', authenticate, ensureDbInit, compartilharCtrl.listar);
router.delete('/compartilhar/:token', authenticate, ensureDbInit, compartilharCtrl.deletar);

router.post('/ai/ask', authenticate, ensureDbInit, aiCtrl.ask);

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
        pushNotifications: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
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
      return res.redirect(`${SPA_URL}?error=${encodeURIComponent(err?.message || info?.message || 'auth_failed')}`);
    }
    res.redirect(`${SPA_URL}?token=${user.token}&nome=${encodeURIComponent(user.nome)}`);
  })(req, res, next);
});

router.get('/auth/github', requireStrategy('github'), passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/auth/github/callback', requireStrategy('github'), (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${SPA_URL}?error=${encodeURIComponent(err?.message || info?.message || 'auth_failed')}`);
    }
    res.redirect(`${SPA_URL}?token=${user.token}&nome=${encodeURIComponent(user.nome)}`);
  })(req, res, next);
});

router.get('/auth/failure', (req, res) => {
  res.redirect(`${SPA_URL}?error=auth_cancelled`);
});

module.exports = router;
